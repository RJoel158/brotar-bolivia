import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY_PORT } from '../ports/user.repository.port';
import type { UserRepositoryPort } from '../ports/user.repository.port';
import type { FilterUsersDto, PaginatedUsersResponseDto } from '../dto/update-kyc.dto';
import { UserDtoMapper } from '../mappers/user-dto.mapper';

@Injectable()
export class GetUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  public async execute(filter?: FilterUsersDto): Promise<PaginatedUsersResponseDto> {
    const page = Math.max(1, Number(filter?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter?.limit) || 10));

    const { users, total } = await this.userRepository.findAll({
      ...filter,
      page,
      limit,
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: users.map((user) => UserDtoMapper.toSummaryDto(user)),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }
}
