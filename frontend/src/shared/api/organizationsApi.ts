import { apiClient } from './apiClient.ts';

export interface OrganizationMember {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  roleInOrg: string;
  joinedAt: string;
}

export interface OrganizationSocialLinks {
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
}

export interface OrganizationItem {
  id: string;
  legalName: string;
  taxId: string;
  address: string | null;
  socialLinks?: OrganizationSocialLinks;
  inviteCode: string;
  inviteLink: string;
  createdAt: string;
  myRole?: string;
  membersCount: number;
  members: OrganizationMember[];
  campaignsCount?: number;
  alreadyMember?: boolean;
}

export interface CreateOrganizationPayload {
  legalName: string;
  taxId?: string;
  address?: string;
  description?: string;
}

export interface UpdateOrganizationPayload {
  legalName?: string;
  address?: string;
  socialLinks?: OrganizationSocialLinks;
}

export const organizationsApi = {
  async getMyOrganizations(): Promise<OrganizationItem[]> {
    const { data } = await apiClient.get<OrganizationItem[]>('/organizations/my');
    return data;
  },

  async createOrganization(payload: CreateOrganizationPayload): Promise<OrganizationItem> {
    const { data } = await apiClient.post<OrganizationItem>('/organizations', payload);
    return data;
  },

  async updateOrganization(
    orgId: string,
    payload: UpdateOrganizationPayload,
  ): Promise<OrganizationItem> {
    const { data } = await apiClient.patch<OrganizationItem>(`/organizations/${orgId}`, payload);
    return data;
  },

  async joinByCode(code: string): Promise<OrganizationItem> {
    const { data } = await apiClient.post<OrganizationItem>('/organizations/join', { code });
    return data;
  },

  async getById(id: string): Promise<OrganizationItem> {
    const { data } = await apiClient.get<OrganizationItem>(`/organizations/${id}`);
    return data;
  },

  async updateMemberRole(
    orgId: string,
    targetUserId: string,
    role: 'admin' | 'creator' | 'member' | 'collaborator',
  ): Promise<OrganizationItem> {
    const { data } = await apiClient.patch<OrganizationItem>(
      `/organizations/${orgId}/members/${targetUserId}`,
      { role },
    );
    return data;
  },

  async removeMember(orgId: string, targetUserId: string): Promise<OrganizationItem> {
    const { data } = await apiClient.delete<OrganizationItem>(
      `/organizations/${orgId}/members/${targetUserId}`,
    );
    return data;
  },

  async deleteOrganization(orgId: string): Promise<void> {
    await apiClient.delete(`/organizations/${orgId}`);
  },
};
