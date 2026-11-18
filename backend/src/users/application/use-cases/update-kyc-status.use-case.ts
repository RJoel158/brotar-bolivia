import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { KycStatus } from '../../domain/value-objects/kyc-status.vo';
import { USER_REPOSITORY_PORT } from '../ports/user.repository.port';
import type { UserRepositoryPort } from '../ports/user.repository.port';
import type { UpdateKycDto } from '../dto/update-kyc.dto';
import type { UserResponseDto } from '../dto/user-response.dto';
import { UserDtoMapper } from '../mappers/user-dto.mapper';
import { NotificationService } from '../../../notifications/application/notification.service';
import { KycApprovedNotification } from '../../../notifications/domain/kyc-approved.notification';
import { KycRequiresDocsNotification } from '../../../notifications/domain/kyc-requires-docs.notification';
import { KycRejectedNotification } from '../../../notifications/domain/kyc-rejected.notification';
import type { Notification } from '../../../notifications/domain/notification.base';

@Injectable()
export class UpdateKycStatusUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    private readonly notificationService: NotificationService,
  ) {}

  public async execute(userId: string, dto: UpdateKycDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`Usuario con ID "${userId}" no encontrado.`);
    }

    const newKycStatus = KycStatus.fromString(dto.kycStatus);
    user.updateKycStatus(newKycStatus, dto.notes, dto.rejectionReason);

    const updatedUser = await this.userRepository.update(user);

    // Dispatch notification
    const recipient = {
      id: user.getId(),
      name: user.getFullName(),
      email: user.getEmail(),
      phone: user.getPhone() ?? undefined,
    };

    let notification: Notification | null = null;
    if (newKycStatus.isVerified()) {
      notification = new KycApprovedNotification(recipient, {
        documentId: user.getDocumentId() ?? undefined,
        verifiedAt: new Date(),
      });
    } else if (newKycStatus.requiresDocumentation()) {
      notification = new KycRequiresDocsNotification(recipient, dto.rejectionReason || '', {
        documentId: user.getDocumentId() ?? undefined,
      });
    } else if (newKycStatus.isRejected()) {
      notification = new KycRejectedNotification(recipient, dto.rejectionReason || '', {
        documentId: user.getDocumentId() ?? undefined,
      });
    }

    if (notification) {
      // Async dispatch without blocking response
      this.notificationService.dispatch(notification).catch(() => {
        // Handled inside provider/service
      });
    }

    return UserDtoMapper.toResponseDto(updatedUser);
  }
}
