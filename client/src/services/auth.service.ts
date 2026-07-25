import { api, setToken } from './api';
import type { AuthResponse, User } from '@/types';

export async function signupOrganization(
  organizationName: string,
  name: string,
  email: string,
  password: string
): Promise<string> {
  const { data } = await api.post<{ message: string }>('/auth/signup', {
    organizationName,
    name,
    email,
    password,
  });
  return data.message;
}

export async function login(email: string, password: string): Promise<User> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  setToken(data.accessToken);
  return data.user;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    setToken(null);
  }
}

export async function forgotPassword(email: string): Promise<string | undefined> {
  const { data } = await api.post<{ resetToken?: string }>('/auth/forgot-password', { email });
  return data.resetToken;
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await api.post('/auth/reset-password', { token, password });
}

export async function fetchProfile(): Promise<User> {
  const { data } = await api.get<{ user: User }>('/user/profile');
  return data.user;
}
