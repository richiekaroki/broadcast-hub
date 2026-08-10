import { req } from './http';

export async function getProfile() {
  return req<{ id: string; email: string; name: string; role: string; createdAt: string }>('/users/me');
}

export async function updateProfile(data: { name?: string }) {
  return req<{ id: string; email: string; name: string; role: string; createdAt: string }>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
