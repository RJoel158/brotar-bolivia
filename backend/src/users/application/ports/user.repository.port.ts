import { User } from '../../domain/entities/user.entity';

export const USER_REPOSITORY_PORT = Symbol('USER_REPOSITORY_PORT');

export interface UserFilterCriteria {
  role?: string;
  kycStatus?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedUsersResult {
  users: User[];
  total: number;
}

export interface UserRepositoryPort {
  save(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(criteria?: UserFilterCriteria): Promise<PaginatedUsersResult>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}
