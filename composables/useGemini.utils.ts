export type GeminiCallResult = { ok: boolean; status: number; data: any };
export type GeminiAttemptFailure = { model: string; status: number; data: any };
export type GeminiFallbackResult =
    | { ok: true; text: string }
    | { ok: false; failures: GeminiAttemptFailure[] };

export const isTransientStatus = (status: number): boolean =>
    status === 429 || status === 503;

export const extractText = (data: any): string | undefined =>
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

export const generateWithFallback = async (params: {
    models: readonly string[];
    callModel: (model: string) => Promise<GeminiCallResult>;
    attemptsPerModel?: number;
    retryDelayMs?: number;
}): Promise<GeminiFallbackResult> => {
    const attemptsPerModel = params.attemptsPerModel ?? 2;
    const retryDelayMs = params.retryDelayMs ?? 500;
    const failures: GeminiAttemptFailure[] = [];

    for (const model of params.models) {
        for (let attempt = 1; attempt <= attemptsPerModel; attempt++) {
            const result = await params.callModel(model);
            const text = extractText(result.data);
            if (result.ok && text !== undefined) {
                return { ok: true, text };
            }

            failures.push({ model, status: result.status, data: result.data });
            const isLastAttemptForModel = attempt === attemptsPerModel;
            if (!isTransientStatus(result.status) || isLastAttemptForModel) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        }
    }

    return { ok: false, failures };
};
