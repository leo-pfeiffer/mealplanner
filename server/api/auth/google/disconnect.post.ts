import { getTokenFromEvent, getSessionUserId } from '~/server/utils/session';
import { deleteGoogleTokens } from '~/server/utils/googleAuth';

export default defineEventHandler(async (event) => {
    const token = getTokenFromEvent(event);
    if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });

    const userId = await getSessionUserId(token);
    if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });

    await deleteGoogleTokens(userId);
    return { status: 200, body: { message: 'Google account disconnected' } };
});
