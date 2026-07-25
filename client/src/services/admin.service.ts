import { api } from './api';
import type { Organization, OrgStatus } from '@/types';

export async function getOrganizations(status?: OrgStatus): Promise<Organization[]> {
  const { data } = await api.get<{ organizations: Organization[] }>('/admin/organizations', {
    params: status ? { status } : undefined,
  });
  return data.organizations;
}

export async function approveOrganization(id: string): Promise<Organization> {
  const { data } = await api.patch<{ organization: Organization }>(`/admin/organizations/${id}/approve`);
  return data.organization;
}

export async function rejectOrganization(id: string, reason?: string): Promise<Organization> {
  const { data } = await api.patch<{ organization: Organization }>(
    `/admin/organizations/${id}/reject`,
    { reason }
  );
  return data.organization;
}
