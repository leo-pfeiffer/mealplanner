export default defineNuxtRouteMiddleware(async (to, from) => {
    const isAuthenticated = async (): Promise<boolean> => { 
        const token = useToken().getToken();
        if (!token) {
            return false;
        }
        return await useLogin().checkAuthToken(token);
    }

    if (await isAuthenticated() === false) {
        return navigateTo('/login')
    }
})
