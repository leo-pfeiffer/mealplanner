import { getTokenFromEvent, getSessionUserId } from '~/server/utils/session';
import { getGoogleConnectionStatus } from '~/server/utils/googleAuth';

export default defineEventHandler(async (event) => {
    const token = getTokenFromEvent(event);
    if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });

    const userId = await getSessionUserId(token);
    if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });

    const connected = await getGoogleConnectionStatus(userId);
    return { connected };
});
