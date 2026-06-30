import { google } from 'googleapis';
import { createHmac } from 'node:crypto';
import { GoogleOAuthToken } from '../dao/models';

export const GOOGLE_TASKS_SCOPE = 'https://www.googleapis.com/auth/tasks';

export function makeOAuth2Client() {
    const config = useRuntimeConfig();
    return new google.auth.OAuth2(
        config.googleClientId as string,
        config.googleClientSecret as string,
        config.googleRedirectUri as string,
    );
}

// Encodes {userId, timestamp} signed with HMAC-SHA256 into a base64url state param.
// Verifiable on OAuth callback without any DB storage.
export function makeOAuthState(userId: number): string {
    const payload = `${userId}:${Date.now()}`;
    const secret = useRuntimeConfig().googleClientSecret as string;
    const sig = createHmac('sha256', secret).update(payload).digest('hex');
    return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

// Returns userId if state is valid and not older than 10 minutes; otherwise throws.
export function verifyOAuthState(state: string): number {
    const decoded = Buffer.from(state, 'base64url').toString();
    const parts = decoded.split(':');
    if (parts.length < 3) throw new Error('malformed state');
    const sig = parts.pop()!;
    const tsStr = parts.pop()!;
    const userIdStr = parts.pop()!;
    const payload = `${userIdStr}:${tsStr}`;
    const secret = useRuntimeConfig().googleClientSecret as string;
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    if (sig !== expected) throw new Error('invalid state signature');
    if (Date.now() - Number(tsStr) > 10 * 60 * 1000) throw new Error('state expired');
    return Number(userIdStr);
}

// Returns an authenticated OAuth2 client for the given user, auto-persisting token refreshes.
export async function getAuthenticatedClient(userId: number) {
    const row = await GoogleOAuthToken.findOne({ where: { userId } });
    if (!row) {
        throw createError({ statusCode: 403, statusMessage: 'Google account not connected' });
    }

    const client = makeOAuth2Client();
    client.setCredentials({
        access_token: row.accessToken,
        refresh_token: row.refreshToken ?? undefined,
        expiry_date: row.expiresAt ? row.expiresAt.getTime() : undefined,
    });

    // Persist any new access tokens issued by auto-refresh
    client.on('tokens', async (tokens) => {
        await row.update({
            accessToken: tokens.access_token ?? row.accessToken,
            expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : row.expiresAt,
        });
    });

    return client;
}

export async function storeTokens(userId: number, tokens: {
    access_token?: string | null;
    refresh_token?: string | null;
    scope?: string | null;
    expiry_date?: number | null;
}) {
    await GoogleOAuthToken.upsert({
        userId,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token ?? null,
        scope: tokens.scope ?? null,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    });
}

export async function getGoogleConnectionStatus(userId: number): Promise<boolean> {
    const row = await GoogleOAuthToken.findOne({ where: { userId } });
    return row !== null;
}

export async function deleteGoogleTokens(userId: number): Promise<void> {
    const row = await GoogleOAuthToken.findOne({ where: { userId } });
    if (!row) return;

    // Best-effort revoke at Google — don't fail if this errors
    try {
        const client = makeOAuth2Client();
        client.setCredentials({ access_token: row.accessToken });
        await client.revokeCredentials();
    } catch {
        // Ignore revocation errors (token may already be expired)
    }

    await row.destroy();
}
