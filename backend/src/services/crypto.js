import crypto from 'node:crypto';
import { env } from '../config/env.js';

const key = Buffer.from(env.TOKEN_ENCRYPTION_KEY, 'hex');
if (key.length !== 32) {
  throw new Error('TOKEN_ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters)');
}

export function encrypt(plaintext) {
  if (!plaintext) throw new Error('Cannot encrypt an empty token');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${data.toString('hex')}`;
}

export function decrypt(payload) {
  const [ivHex, tagHex, dataHex] = String(payload || '').split(':');
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error('Invalid encrypted token payload');
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}