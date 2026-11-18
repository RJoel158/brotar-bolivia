import { User } from '../../domain/entities/user.entity';

export const TOKEN_SERVICE_PORT = Symbol('TOKEN_SERVICE_PORT');

export interface AuthTokens {
  accessToken: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  kycStatus: string;
}

export interface TokenServicePort {
  generateTokens(user: User): Promise<AuthTokens>;
  verifyToken(token: string): Promise<TokenPayload>;
}
