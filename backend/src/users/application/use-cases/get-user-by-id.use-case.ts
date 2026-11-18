import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY_PORT } from '../ports/user.repository.port';
import type { UserRepositoryPort } from '../ports/user.repository.port';
import type { OwnerUserResponseDto, UserResponseDto } from '../dto/user-response.dto';
import { UserDtoMapper } from '../mappers/user-dto.mapper';
import type { User } from '../../domain/entities/user.entity';

export interface UserViewer {
  id: string;
  role: string;
}

@Injectable()
export class GetUserByIdUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  /**
   * The owner gets their own record without internal notes, an admin gets the
   * full record and anyone else is rejected before looking the user up, so the
   * response does not reveal whether the ID exists.
   */
  public async execute(
    id: string,
    viewer: UserViewer,
  ): Promise<UserResponseDto | OwnerUserResponseDto> {
    if (viewer.id === id) {
      return this.executeForOwner(id);
    }
    if (viewer.role !== 'admin') {
      throw new ForbiddenException('No tienes permiso para consultar este usuario.');
    }
    return UserDtoMapper.toResponseDto(await this.findOrFail(id));
  }

  public async executeForOwner(userId: string): Promise<OwnerUserResponseDto> {
    return UserDtoMapper.toOwnerResponseDto(await this.findOrFail(userId));
  }

  private async findOrFail(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
    }
    return user;
  }
}
