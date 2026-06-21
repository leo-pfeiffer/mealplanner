import { createError } from 'h3';

const MAX_ATTEMPTS = 30;
const WINDOW_MS = 15 * 60 * 1000;

interface Bucket {
    count: number;
    windowStart: number;
}

const buckets = new Map<string, Bucket>();

const isExpired = (bucket: Bucket): boolean => {
    return Date.now() - bucket.windowStart > WINDOW_MS;
}

export const assertNotRateLimited = (key: string): void => {
    const bucket = buckets.get(key);
    if (!bucket || isExpired(bucket)) {
        return;
    }
    if (bucket.count >= MAX_ATTEMPTS) {
        throw createError({ statusCode: 429, message: 'Too many attempts. Try again later.' });
    }
}

export const recordAttempt = (key: string): void => {
    const bucket = buckets.get(key);
    if (!bucket || isExpired(bucket)) {
        buckets.set(key, { count: 1, windowStart: Date.now() });
        return;
    }
    bucket.count += 1;
}

export const clearRateLimit = (key: string): void => {
    buckets.delete(key);
}
