import { deleteCookie } from 'h3';
import { getTokenFromEvent, deleteSession, SESSION_COOKIE_NAME } from '../../utils/session';

export default defineEventHandler(async (event) => {
  const token = getTokenFromEvent(event);
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  await deleteSession(token);
  deleteCookie(event, SESSION_COOKIE_NAME, { path: '/' });

  return { status: 200, body: { message: 'Logged out' } };
});
