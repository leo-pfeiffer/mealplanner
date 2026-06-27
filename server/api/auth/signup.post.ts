import bcrypt from 'bcrypt';
import { createError, getRequestIP, readBody, setResponseStatus } from 'h3';
import { User } from '../../dao/models';
import { assertNotRateLimited, recordAttempt } from '../../utils/rateLimit';

const UNKNOWN_IP = 'unknown';

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event) || UNKNOWN_IP;
  assertNotRateLimited(`signup:${ip}`);
  recordAttempt(`signup:${ip}`);

  const body = await readBody(event);
  const email = body?.email;
  const password = body?.password;

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required' });
  }

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw createError({ statusCode: 409, statusMessage: 'Email already in use' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash });

  setResponseStatus(event, 201);
  return { status: 201, body: { email: user.email } };
});
