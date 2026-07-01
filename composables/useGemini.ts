import { generateWithFallback } from './useGemini.utils';

// Ordered by preference. Each entry must be a genuinely different model
// (not just an alias) since Gemini's free-tier rate limits are tracked
// per model — a 429/503 on the first model doesn't block the second.
// This list is hardcoded rather than env-driven; changing it requires a
// code change, which is an acceptable tradeoff for a single-instance app.
const MODELS = ['gemini-3.1-flash-lite', 'gemini-2.5-flash-lite'] as const;

export const useGemini = () => {
    const config = useRuntimeConfig();
    const API_KEY = config.public.geminiAPIKey;
    if (!API_KEY) {
        throw new Error('Missing environment variables for Gemini');
    }

    const callOnce = async (model: string, body: Record<string, unknown>): Promise<{ ok: boolean; status: number; data: any }> => {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
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

        let outcome;
        try {
            outcome = await generateWithFallback({
                models: MODELS,
                callModel: (model) => callOnce(model, body),
            });
        } catch (err) {
            console.error('Error fetching from Gemini:', err);
            throw Error("Error fetching from Gemini.");
        }

        if (outcome.ok) {
            return outcome.text;
        }

        console.error('Error parsing response from Gemini:', outcome.failures);
        const triedModels = [...new Set(outcome.failures.map(f => f.model))].join(', ');
        throw Error(`Error parsing response from Gemini (tried: ${triedModels}).`);
    }

    return { generate };
}
