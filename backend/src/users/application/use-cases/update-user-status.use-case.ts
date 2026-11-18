import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY_PORT } from '../ports/user.repository.port';
import type { UserRepositoryPort } from '../ports/user.repository.port';
import type { UserResponseDto } from '../dto/user-response.dto';
import { UserDtoMapper } from '../mappers/user-dto.mapper';

export interface UpdateUserStatusDto {
  status: 'active' | 'inactive';
}

@Injectable()
export class UpdateUserStatusUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  public async execute(userId: string, dto: UpdateUserStatusDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`Usuario con ID "${userId}" no encontrado.`);
    }

    if (dto.status === 'inactive') {
      user.deactivate();
    } else {
      user.activate();
    }

    const updatedUser = await this.userRepository.update(user);
    return UserDtoMapper.toResponseDto(updatedUser);
  }
}
