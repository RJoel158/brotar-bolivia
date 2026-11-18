import type { OwnerUserResponseDto } from './user-response.dto';

export interface AuthResponseDto {
  user: OwnerUserResponseDto;
  accessToken: string;
}
