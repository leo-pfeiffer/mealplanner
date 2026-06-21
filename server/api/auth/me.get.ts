import { getTokenFromEvent, getSessionUserId } from '../../utils/session';
import { User } from '../../dao/models';

export default defineEventHandler(async (event) => {
  const token = getTokenFromEvent(event);
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const userId = await getSessionUserId(token);
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  return { status: 200, body: { email: user.email } };
});
