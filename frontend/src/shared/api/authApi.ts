import { apiClient } from './apiClient.ts';
import type { UserProfile } from '../types/index.ts';

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role?: 'creator' | 'sponsor';
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
    if (data.accessToken) {
      localStorage.setItem('brotar_access_token', data.accessToken);
    }
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    if (data.accessToken) {
      localStorage.setItem('brotar_access_token', data.accessToken);
    }
    return data;
  },

  async getMe(): Promise<UserProfile> {
    const { data } = await apiClient.get<UserProfile>('/users/me');
    return data;
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/forgot-password',
      { email: email.trim().toLowerCase() },
    );
    return data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/reset-password', { token, newPassword },
    );
    return data;
  },

  logout(): void {
    localStorage.removeItem('brotar_access_token');
  },
};
