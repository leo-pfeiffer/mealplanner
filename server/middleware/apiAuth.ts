import { useCreds } from "~/composables/useCreds";

export default defineEventHandler((event) => {
    const currentPath = event.node.req.url || '';
    if (!currentPath.startsWith('/api')) {
      // Only check auth for API routes
      return;
    }

    const cookieHeader = getHeader(event, 'Cookie');
    const authHeaders = getHeader(event, 'Authorization');
    let token;

    // use auth header first if present
    if (authHeaders) {
      token = useCreds().getTokenFromHeaderString(authHeaders);
    }
    else if (cookieHeader) {
      token = useCreds().getTokenFromCookieString(cookieHeader);
    }

    if (!token) {
      throw createError({ statusCode: 401, message: 'Unauthorized' });
    } else if (!useCreds().checkCreds(token)) {
      throw createError({ statusCode: 401, message: 'Unauthorized' });
    }
  })
  