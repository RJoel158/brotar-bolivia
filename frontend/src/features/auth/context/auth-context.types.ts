import type { LoginPayload, RegisterPayload } from '../../../shared/api/authApi.ts';
import type { UserProfile } from '../../../shared/types/index.ts';

export interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (payload: LoginPayload) => Promise<UserProfile>;
  register: (payload: RegisterPayload) => Promise<UserProfile>;
  logout: () => void;
  refreshUser: () => Promise<UserProfile | null>;
  homeRoute: string;
}
