export const useLogin = () => {

    const login = async (username: string, password: string) => {
        const base64string = btoa(`${username}:${password}`);
        const success = await fetch('/auth', {
            method: 'GET', 
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${base64string}`
            }
        })
        .then(res => res.json())
        .then(data =>{
            if (data.status !== 200) {
                console.log("Login failed.", data.status);
                useToken().deleteTokenCookie();
                return false;
            }
            const token = data.body.token;
            if (token) {
                useToken().setTokenCookie(token);
                return true;
            } else {
                console.log("Missing token. Login failed.", data);
                return false;
            }
        })
        return success;
    }

    const checkAuthToken = async (token: string) => {
        if (!token) {
            return false;
        }
        const config = useRuntimeConfig();
        const success = await fetch(`${config.public.appURL}/auth`, {
            method: 'GET', 
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }).then(res => {
            if (res.status !== 200) {
                return false;
            }
            return true;
        });
        return success;
    }

    const logout = () => {
        useToken().deleteTokenCookie();
        navigateTo('/login');
    }

    return { login, checkAuthToken, logout }
}