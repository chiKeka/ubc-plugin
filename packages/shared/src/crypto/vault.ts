/**
 * AES-256-GCM encryption/decryption for credential storage.
 *
 * The encryption key is derived from a server-side secret combined with the
 * user's auth context, ensuring per-user isolation.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

export interface EncryptedPayload {
  encrypted: string;
  iv: string;
  tag: string;
  salt: string;
}

/**
 * Derive an encryption key from a secret + user ID using scrypt.
 * This ensures each user's credentials are encrypted with a unique key.
 */
function deriveKey(secret: string, userId: string, salt: Buffer): Buffer {
  return scryptSync(`${secret}:${userId}`, salt, KEY_LENGTH);
}

/**
 * Encrypt a plaintext value using AES-256-GCM.
 */
export function encrypt(
  plaintext: string,
  secret: string,
  userId: string
): EncryptedPayload {
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(secret, userId, salt);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");
  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    salt: salt.toString("base64"),
  };
}

/**
 * Decrypt an encrypted payload using AES-256-GCM.
 */
export function decrypt(
  payload: EncryptedPayload,
  secret: string,
  userId: string
): string {
  const salt = Buffer.from(payload.salt, "base64");
  const key = deriveKey(secret, userId, salt);
  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(payload.encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
