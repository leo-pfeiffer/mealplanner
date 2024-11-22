export default defineNuxtRouteMiddleware(async (to, from) => {
    const isAuthenticated = async (): Promise<boolean> => { 
        const token = useToken().getToken();
        if (!token) {
            console.log("No token. Not authenticated.");
            return false;
        }
        const authenticated = await useLogin().checkAuthToken(token);
        console.log("isAuthenticated", authenticated);
        return authenticated;
    }
    console.log("here");
    if (await isAuthenticated() === false) {
        console.log("there");
        return navigateTo('/login')
    }
    console.log("everywhere");
})
