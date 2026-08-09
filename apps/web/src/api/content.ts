import { req } from './http';
import { ContentItem } from './types';

export const fetchContent     = ()                                    => req<ContentItem[]>('/content');
export const fetchContentById = (id: string)                          => req<ContentItem>(`/content/${id}`);
export const createContent    = (d: { title: string; body: string })  => req<ContentItem>('/content', { method: 'POST', body: JSON.stringify(d) });
export const updateContent    = (id: string, d: Partial<{ title: string; body: string }>) => req<ContentItem>(`/content/${id}`, { method: 'PATCH', body: JSON.stringify(d) });
export const submitContent    = (id: string)                          => req<ContentItem>(`/content/${id}/submit`, { method: 'POST' });
export const publishContent   = (id: string)                          => req<ContentItem>(`/content/${id}/publish`, { method: 'PATCH' });
export const rejectContent    = (id: string, reason: string)          => req<ContentItem>(`/content/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) });
export const deleteContent    = (id: string)                          => req<void>(`/content/${id}`, { method: 'DELETE' });
