import { createHash } from 'node:crypto';

export const useCreds = () => {

    const toSha256 = (base64string: string): string => {
        return createHash('sha256').update(base64string).digest('hex');
    }

    const getLoginCreds = () => {
        const config = useRuntimeConfig()
        const envUsername = config.public.appUser;
        const envPassword = config.public.appPassword;
        if (!envUsername || !envPassword) {
            throw new Error('Environment variables NUXT_APP_USER and NUXT_APP_PASSWORD must be set')
        }
        return toSha256(btoa(`${envUsername}:${envPassword}`));
    }

    const LOGIN_CREDS = getLoginCreds();

    const checkCreds = (token: string) => {
        return token === LOGIN_CREDS;
    }

    const getCreds = () => {
        return LOGIN_CREDS;
    }

    const getTokenFromHeaderString = (authHeader: string) => {
        const authType = authHeader.split(' ')[0];
        if (authType === 'Bearer') {
            return authHeader.split(' ')[1];
        } else {
            return null;
        }
    }

    const getTokenFromCookieString = (cookieHeader: string) => {
        return cookieHeader?.split(" ")
            .find((c) => c.startsWith("mealPlannerAuthToken="))?.split("=")[1];
    }

    return { checkCreds, getCreds, getTokenFromHeaderString, getTokenFromCookieString }
}
