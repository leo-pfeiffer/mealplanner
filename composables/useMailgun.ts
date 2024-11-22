export const useMailgun = () => {

    const config = useRuntimeConfig();

    const MAILJET_URL = config.public.mailjetUrl;
    const API_KEY = config.public.mailjetAPIKey;
    const SECRET_KEY = config.public.mailjetSecretKey;
    const FROM_EMAIL = `Mealplanner <${config.public.mailjetFromEmail}>`;
    const TO_EMAIL = config.public.mailjetToEmail;

    // validate all config values exist
    if (!MAILJET_URL || !API_KEY || !SECRET_KEY || !FROM_EMAIL || !TO_EMAIL) {
        throw new Error('Missing environment variables for Mailjet');
    }

    const send = async (text: string) => {
        const resp = await fetch(MAILJET_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${btoa(`${API_KEY}:${SECRET_KEY}`)}`
            },
            body: JSON.stringify({
                "Messages":[
                    {
                        "From": {
                            "Email": FROM_EMAIL,
                            "Name": "Meal Planner"
                        },
                        "To": [
                            {
                                "Email": TO_EMAIL,
                            }
                        ],
                        "Subject": "A meal plan has been sent to you!",
                        "HTMLPart": text
                    }
                ]
            })
        });
        return resp.json();
    }
    
    return { send };
};