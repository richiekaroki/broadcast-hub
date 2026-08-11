import { req } from './http';
import type { UserProfile, AuditLogEntry } from './types';

export type { UserProfile, AuditLogEntry };

export async function getProfile() {
  return req<UserProfile>('/users/me');
}

export async function updateProfile(data: { name?: string }) {
  return req<UserProfile>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function listUsers() {
  return req<UserProfile[]>('/users');
}

export async function changeUserRole(userId: string, role: string) {
  return req<UserProfile>(`/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function getAuditLogs() {
  return req<AuditLogEntry[]>('/users/audit-logs');
}
