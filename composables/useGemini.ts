export const useGemini = () => {
    const config = useRuntimeConfig();
    const API_KEY = config.public.geminiAPIKey;
    if (!API_KEY) {
        throw new Error('Missing environment variables for Gemini');
    }

    const callOnce = async (body: Record<string, unknown>): Promise<{ ok: boolean; status: number; data: any }> => {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        return { ok: res.ok, status: res.status, data };
    }

    const generate = async (prompt: string, options?: { responseMimeType?: 'application/json' }): Promise<string> => {
        const body: Record<string, unknown> = { contents: [{ parts: [{ text: prompt }] }] };
        if (options?.responseMimeType) {
            body.generationConfig = { responseMimeType: options.responseMimeType };
        }

        // Gemini occasionally returns transient 429/503 errors ("high demand") — one short retry
        // resolves most of these without masking genuine failures behind a generic parse error.
        const maxAttempts = 2;
        let lastFailure: { status: number; data: any } | null = null;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            let result;
            try {
                result = await callOnce(body);
            } catch (err) {
                console.error('Error fetching from Gemini:', err);
                throw Error("Error fetching from Gemini.");
            }

            if (result.ok && result.data?.candidates?.[0]?.content?.parts?.[0]?.text !== undefined) {
                return result.data.candidates[0].content.parts[0].text;
            }

            lastFailure = { status: result.status, data: result.data };
            const isTransient = result.status === 429 || result.status === 503;
            if (!isTransient || attempt === maxAttempts) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.error('Error parsing response from Gemini:', lastFailure);
        throw Error("Error parsing response from Gemini.");
    }

    return { generate };
}
