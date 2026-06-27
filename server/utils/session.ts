import { createHash, randomBytes } from 'node:crypto';
import { Op } from 'sequelize';
import { Session } from '../dao/models';

export { SESSION_COOKIE_NAME, getTokenFromHeaderString, getTokenFromCookieString, getTokenFromEvent } from './token';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const hashToken = (token: string): string => {
    return createHash('sha256').update(token).digest('hex');
}

export const createSession = async (userId: number): Promise<{ token: string; expiresAt: Date }> => {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await Session.create({ tokenHash: hashToken(token), userId, expiresAt });
    return { token, expiresAt };
}

export const getSessionUserId = async (token: string): Promise<number | null> => {
    const session = await Session.findOne({ where: { tokenHash: hashToken(token) } });
    if (!session) {
        return null;
    }
    if (session.expiresAt.getTime() <= Date.now()) {
        await session.destroy();
        return null;
    }
    return session.userId;
}

export const deleteSession = async (token: string): Promise<void> => {
    await Session.destroy({ where: { tokenHash: hashToken(token) } });
}

export const deleteExpiredSessions = async (): Promise<void> => {
    await Session.destroy({ where: { expiresAt: { [Op.lte]: new Date() } } });
}
