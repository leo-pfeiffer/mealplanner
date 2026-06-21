import { getHeader, type H3Event } from 'h3';

export const SESSION_COOKIE_NAME = 'mealPlannerAuthToken';

export const getTokenFromHeaderString = (authHeader: string): string | null => {
    const [authType, token] = authHeader.split(' ');
    return authType === 'Bearer' && token ? token : null;
}

export const getTokenFromCookieString = (cookieHeader: string): string | null => {
    return cookieHeader.split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`))
        ?.split('=')[1] ?? null;
}

export const getTokenFromEvent = (event: H3Event): string | null => {
    const authHeader = getHeader(event, 'Authorization');
    if (authHeader) {
        return getTokenFromHeaderString(authHeader);
    }
    const cookieHeader = getHeader(event, 'Cookie');
    if (cookieHeader) {
        return getTokenFromCookieString(cookieHeader);
    }
    return null;
}
