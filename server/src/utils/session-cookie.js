import { createHash, randomBytes } from 'node:crypto';

export const SESSION_COOKIE_NAME = 'cochasabor_session';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function createSessionToken() {
  return randomBytes(32).toString('base64url');
}

export function createSessionExpiry() {
  return new Date(Date.now() + SESSION_TTL_MS).toISOString().slice(0, 23).replace('T', ' ');
}

export function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function getSessionToken(request) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    if (name === SESSION_COOKIE_NAME) return part.slice(separator + 1).trim() || null;
  }
  return null;
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1',
  };
}

export function setSessionCookie(response, token) {
  response.cookie(SESSION_COOKIE_NAME, token, {
    ...cookieOptions(),
    maxAge: SESSION_TTL_MS,
  });
}

export function clearSessionCookie(response) {
  response.clearCookie(SESSION_COOKIE_NAME, cookieOptions());
}
