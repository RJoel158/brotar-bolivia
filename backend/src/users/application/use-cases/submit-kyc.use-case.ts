import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY_PORT } from '../ports/user.repository.port';
import type { UserRepositoryPort } from '../ports/user.repository.port';
import type { SubmitKycDto } from '../dto/submit-kyc.dto';
import type { OwnerUserResponseDto } from '../dto/user-response.dto';
import { UserDtoMapper } from '../mappers/user-dto.mapper';
import { FileSignatureValidator } from '../../../shared/utils/file-signature-validator.util';

@Injectable()
export class SubmitKycUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  public async execute(userId: string, dto: SubmitKycDto): Promise<OwnerUserResponseDto> {
    if (dto.documentType.trim().toUpperCase() === 'CI' && !dto.documentBackUrl?.trim()) {
      throw new BadRequestException('El reverso es obligatorio para CI.');
    }
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`Usuario con ID "${userId}" no encontrado.`);
    }

    // Validar firma binaria y anti-inyección del anverso
    FileSignatureValidator.validateImageDataUrl(dto.documentFrontUrl, 'Anverso del documento (Frontal)');

    // Validar firma binaria y anti-inyección del reverso (si se envió)
    if (dto.documentBackUrl) {
      FileSignatureValidator.validateImageDataUrl(dto.documentBackUrl, 'Reverso del documento (Posterior)');
    }

    user.submitKyc({
      documentId: dto.documentId.trim().toUpperCase(),
      documentType: dto.documentType.trim().toUpperCase(),
      organizationName: dto.organizationName?.trim() || null,
      phone: dto.phone?.trim() || null,
      documentFrontUrl: dto.documentFrontUrl.trim(),
      documentBackUrl: dto.documentBackUrl?.trim() || null,
    });

    const updatedUser = await this.userRepository.update(user);
    return UserDtoMapper.toOwnerResponseDto(updatedUser);
  }
}
