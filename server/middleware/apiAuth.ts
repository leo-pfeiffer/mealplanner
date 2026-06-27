import { getTokenFromEvent, getSessionUserId } from '../utils/session';

export default defineEventHandler(async (event) => {
    const currentPath = event.node.req.url || '';
    if (!currentPath.startsWith('/api') || currentPath.startsWith('/api/auth')) {
        // Only check auth for API routes. /api/auth/* is excluded since those
        // are the self-contained auth endpoints (signup/login/etc.) that
        // must be reachable without already holding a token.
        return;
    }
    const token = getTokenFromEvent(event);
    if (!token) {
        throw createError({ statusCode: 401, message: 'Unauthorized' });
    }
    const userId = await getSessionUserId(token);
    if (!userId) {
        throw createError({ statusCode: 401, message: 'Unauthorized' });
    }
    event.context.userId = userId;
});
