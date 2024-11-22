import { createHash } from 'node:crypto';
import { useCreds } from '~/composables/useCreds';

const toSha256 = (base64string: string): string => {
  return createHash('sha256').update(base64string).digest('hex');
}

export default defineEventHandler((event) => {
  const authHeader = getHeader(event, 'Authorization');

  if (!authHeader) {
    return { status: 401, body: 'Unauthorized' };
  }

  const authType = authHeader.split(' ')[0];
  const authPassedCreds = authHeader.split(' ')[1];

  if (authType === 'Basic' && !useCreds().checkCreds(toSha256(authPassedCreds))) {
    return { status: 401, body: 'Unauthorized' };
  } 
  if (authType === 'Bearer' && !useCreds().checkCreds(authPassedCreds)) {
    return { status: 401, body: 'Unauthorized' };
  }
  return { status: 200, body: {token: useCreds().getCreds()} };
});