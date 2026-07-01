import { getTokenFromEvent, getSessionUserId } from '~/server/utils/session';
import { makeOAuth2Client, makeOAuthState, GOOGLE_TASKS_SCOPE } from '~/server/utils/googleAuth';

export default defineEventHandler(async (event) => {
    const token = getTokenFromEvent(event);
    if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });

    const userId = await getSessionUserId(token);
    if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });

    const client = makeOAuth2Client();
    const state = makeOAuthState(userId);
    const url = client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [GOOGLE_TASKS_SCOPE],
        state,
    });

    return { url };
});
