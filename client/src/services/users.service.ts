import { api } from './api';
import type { ManagedUser, Permissions, DetectionEvent, Pagination } from '@/types';

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  designation: string;
  level: number;
  permissions: Permissions;
}

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, 'email'>> & {
  status?: 'active' | 'inactive';
};

export async function getManagedUsers(): Promise<ManagedUser[]> {
  const { data } = await api.get<{ users: ManagedUser[] }>('/user/manage');
  return data.users;
}

export async function createManagedUser(payload: CreateUserPayload): Promise<ManagedUser> {
  const { data } = await api.post<{ user: ManagedUser }>('/user/manage', payload);
  return data.user;
}

export async function getManagedUser(id: string): Promise<ManagedUser> {
  const { data } = await api.get<{ user: ManagedUser }>(`/user/manage/${id}`);
  return data.user;
}

export interface UserDetectionsResponse {
  user: { _id: string; name: string; email: string; designation: string; level: number };
  items: DetectionEvent[];
  pagination: Pagination;
}

export async function getManagedUserDetections(
  id: string,
  page = 1,
  limit = 20
): Promise<UserDetectionsResponse> {
  const { data } = await api.get<UserDetectionsResponse>(`/user/manage/${id}/detections`, {
    params: { page, limit },
  });
  return data;
}

export async function updateManagedUser(id: string, payload: UpdateUserPayload): Promise<ManagedUser> {
  const { data } = await api.put<{ user: ManagedUser }>(`/user/manage/${id}`, payload);
  return data.user;
}

export async function deactivateManagedUser(id: string): Promise<void> {
  await api.delete(`/user/manage/${id}`);
}
