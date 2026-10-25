import crypto from 'crypto';
import { cookies } from 'next/headers';
import { pool } from './db';

const COOKIE = 'dt_admin';
const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 5;

function sessionToken() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const password = process.env.ADMIN_PASSWORD;
  if (!secret || !password) return null;
  return crypto.createHmac('sha256', secret).update('deco-turco|' + password).digest('hex');
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function ipHash(ip) {
  return crypto.createHmac('sha256', process.env.ADMIN_SESSION_SECRET)
    .update('login-ip|' + String(ip || 'unknown')).digest('hex');
}

export function isAdmin() {
  const expected = sessionToken();
  if (!expected) return false;
  return safeEqual(cookies().get(COOKIE)?.value, expected);
}

export async function startSession(password, ip) {
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) return false;
  const hash = ipHash(ip);
  const { rows } = await pool.query(
    'select failed_attempts, window_started from admin_login_attempts where ip_hash=$1',
    [hash]
  );
  const attempt = rows[0];
  if (attempt && Number(attempt.failed_attempts) >= MAX_ATTEMPTS &&
      Date.now() - new Date(attempt.window_started).getTime() < WINDOW_MINUTES * 60 * 1000) return false;

  if (!safeEqual(password, process.env.ADMIN_PASSWORD)) {
    await pool.query(
      `insert into admin_login_attempts (ip_hash, window_started, failed_attempts)
       values ($1, now(), 1)
       on conflict (ip_hash) do update set
         failed_attempts = case when admin_login_attempts.window_started < now() - interval '15 minutes'
           then 1 else admin_login_attempts.failed_attempts + 1 end,
         window_started = case when admin_login_attempts.window_started < now() - interval '15 minutes'
           then now() else admin_login_attempts.window_started end`,
      [hash]
    );
    return false;
  }

  await pool.query('delete from admin_login_attempts where ip_hash=$1', [hash]);
  cookies().set(COOKIE, sessionToken(), {
    httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 60 * 60 * 8,
  });
  return true;
}

export function endSession() {
  cookies().delete(COOKIE);
}
