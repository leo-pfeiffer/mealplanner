export const useLogin = () => {

    const login = async (email: string, password: string): Promise<boolean> => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        return res.ok
    }

    const signup = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        if (res.ok) {
            return { success: true }
        }
        const data = await res.json().catch(() => ({}))
        return { success: false, error: data?.statusMessage || 'Signup failed' }
    }

    const checkAuth = async (): Promise<boolean> => {
        // Use Nuxt's SSR-aware fetch: plain fetch('/api/auth/me') fails during
        // server-side rendering because relative URLs can't be resolved by
        // Node's fetch, and it wouldn't forward the incoming request's cookie
        // either. useRequestFetch() resolves the URL correctly in both SSR and
        // client contexts and forwards the session cookie automatically.
        const requestFetch = useRequestFetch()
        try {
            await requestFetch('/api/auth/me')
            return true
        } catch {
            return false
        }
    }

    const logout = async (): Promise<void> => {
        const requestFetch = useRequestFetch()
        await requestFetch('/api/auth/logout', { method: 'POST' })
    }

    return { login, signup, checkAuth, logout }
}
