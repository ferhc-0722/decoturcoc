import crypto from 'crypto';
import { cookies } from 'next/headers';

const COOKIE = 'dt_admin';
const token = () =>
  crypto.createHash('sha256').update((process.env.ADMIN_PASSWORD || '') + '|deco-turco').digest('hex');

export function isAdmin() {
  if (!process.env.ADMIN_PASSWORD) return false;
  return cookies().get(COOKIE)?.value === token();
}

export function startSession(password) {
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) return false;
  cookies().set(COOKIE, token(), {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7,
  });
  return true;
}

export function endSession() {
  cookies().delete(COOKIE);
}
