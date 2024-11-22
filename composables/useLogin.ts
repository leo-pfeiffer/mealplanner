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
                console.log("Login successful.");
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
            console.log("1No token. Not authenticated.");
            return false;
        }
        console.log("Checking token", token);
        const config = useRuntimeConfig();
        const success = await fetch(`${config.public.appURL}/auth`, {
            method: 'GET', 
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }).then(res => {
            console.log("res:", res);
            if (res.status !== 200) {
                console.log("Login failed", res.status);
                return false;
            }
            return true;
        });
        return success;
    }

    const logout = () => {
        // useToken().deleteTokenCookie();
    }

    return { login, checkAuthToken, logout }
}