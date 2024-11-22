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
      console.log("reading header");
        const authType = authHeaders.split(' ')[0];
        if (authType === 'Bearer') {
          token = authHeaders.split(' ')[1];
        } else {
          throw createError({ statusCode: 401, message: 'Unauthorized' });
        }
    }
    // else use cookie 
    else if (cookieHeader) {
      console.log("reading cookie");
        token = cookieHeader?.split(" ")
          .find((c) => c.startsWith("mealPlannerAuthToken="))?.split("=")[1];
    }

    console.log("token", token);

    if (!token) {
      throw createError({ statusCode: 401, message: 'Unauthorized' });
    } else if (!useCreds().checkCreds(token)) {
      throw createError({ statusCode: 401, message: 'Unauthorized' });
    }    
  })
  