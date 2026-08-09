import { req } from './http';
import { tokens } from './http';
import { TokenPair } from './types';

export async function requestMagicLink(email: string): Promise<void> {
  await req('/auth/magic-link', { method: 'POST', body: JSON.stringify({ email }) });
}

export async function verifyMagicLink(token: string): Promise<TokenPair> {
  const data = await req<TokenPair>(`/auth/magic-link/verify?token=${encodeURIComponent(token)}`);
  tokens.set(data.accessToken, data.refreshToken);
  return data;
}

export async function logout(): Promise<void> {
  const rt = tokens.refresh;
  if (rt && tokens.access) {
    await req('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: rt }) }).catch(() => {});
  }
  tokens.clear();
}
