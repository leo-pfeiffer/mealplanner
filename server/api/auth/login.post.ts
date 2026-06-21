import bcrypt from 'bcrypt';
import { createError, readBody, setCookie } from 'h3';
import { User } from '../../dao/models';
import { assertNotRateLimited, clearRateLimit, recordAttempt } from '../../utils/rateLimit';
import { createSession, SESSION_COOKIE_NAME } from '../../utils/session';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const email = body?.email;
  const password = body?.password;

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required' });
  }

  assertNotRateLimited(`login:${email}`);

  const user = await User.findOne({ where: { email } });
  if (!user) {
    recordAttempt(`login:${email}`);
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    recordAttempt(`login:${email}`);
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' });
  }

  clearRateLimit(`login:${email}`);
  const { token, expiresAt } = await createSession(user.id);

  setCookie(event, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: !(process.env.APP_URL ?? '').includes('localhost'),
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return { status: 200, body: { email: user.email } };
});
