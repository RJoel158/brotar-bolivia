import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateOrganizationDto {
  @IsNotEmpty({ message: 'El nombre de la organización es obligatorio' })
  @IsString()
  @Length(3, 150, { message: 'El nombre debe tener entre 3 y 150 caracteres' })
  legalName: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class JoinOrganizationDto {
  @IsNotEmpty({ message: 'El código de invitación es obligatorio' })
  @IsString()
  @Length(4, 30, { message: 'El código de invitación no es válido' })
  code: string;
}

export class UpdateMemberRoleDto {
  @IsNotEmpty({ message: 'El rol es obligatorio' })
  @IsString()
  role: 'admin' | 'creator' | 'member' | 'collaborator';
}

export interface OrganizationMemberDto {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  roleInOrg: string;
  joinedAt: string;
}

export class OrganizationSocialLinksDto {
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  facebook?: string;

  @IsOptional()
  @IsString()
  youtube?: string;

  @IsOptional()
  @IsString()
  tiktok?: string;
}

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @Length(2, 150, { message: 'El nombre debe tener entre 2 y 150 caracteres' })
  legalName?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  socialLinks?: OrganizationSocialLinksDto;
}

export interface OrganizationResponseDto {
  id: string;
  legalName: string;
  taxId: string;
  address: string | null;
  socialLinks?: {
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
  };
  inviteCode: string;
  inviteLink: string;
  createdAt: string;
  myRole?: string;
  membersCount: number;
  members: OrganizationMemberDto[];
  campaignsCount?: number;
  alreadyMember?: boolean;
}
