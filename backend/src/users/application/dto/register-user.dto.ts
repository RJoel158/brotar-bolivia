export interface RegisterUserDto {
  email: string;
  password: string;
  fullName: string;
  role?: 'creator' | 'sponsor';
  phone?: string;
}
