export default defineNuxtRouteMiddleware(async (to, from) => {
    if (await useLogin().checkAuth() === false) {
        return navigateTo('/login')
    }
})
