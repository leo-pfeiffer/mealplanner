export const useGemini = () => {
    const config = useRuntimeConfig();
    const API_KEY = config.public.geminiAPIKey;
    if (!API_KEY) {
        throw new Error('Missing environment variables for Gemini');
    }

    const generate = async (prompt: string): Promise<string> => {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "contents": [{ "parts": [{ "text": prompt }] }]
            })
        })
        .then(res => res.json())
        .then(data => {
            try {
                return data.candidates[0].content.parts[0].text;
            } catch (error) {
                console.error(error);
                throw Error("Error parsing response from Gemini.");
            }
        })
        .catch(err => {
            console.error(err);
            throw Error("Error fetching from Gemini.");
        });
        return resp;
    }

    return { generate };
}
