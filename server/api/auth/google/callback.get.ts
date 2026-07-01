import { makeOAuth2Client, verifyOAuthState, storeTokens } from '~/server/utils/googleAuth';

export default defineEventHandler(async (event) => {
    const { code, state, error } = getQuery(event);

    if (error) {
        return sendRedirect(event, '/settings?google=error');
    }

    if (!code || !state) {
        throw createError({ statusCode: 400, statusMessage: 'Missing code or state' });
    }

    let userId: number;
    try {
        userId = verifyOAuthState(state as string);
    } catch {
        throw createError({ statusCode: 400, statusMessage: 'Invalid OAuth state' });
    }

    const client = makeOAuth2Client();
    const { tokens } = await client.getToken(code as string);
    await storeTokens(userId, tokens);

    return sendRedirect(event, '/settings?google=connected');
});
