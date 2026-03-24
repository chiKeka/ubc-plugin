/**
 * Credential storage — stores credentials locally in .ubc/credentials/
 *
 * Credentials are encrypted with AES-256-GCM using a machine-local key.
 * The key is generated on first use and stored in .ubc/.key (mode 0600).
 * Credential files are also stored with mode 0600 (owner-only read/write).
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  chmodSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from "node:crypto";
import { addCredentialToState } from "./state.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UBC_DIR = join(__dirname, "..", "..", ".ubc");
const CREDS_DIR = join(UBC_DIR, "credentials");
const KEY_FILE = join(UBC_DIR, ".key");

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT = "ubc-credential-store"; // fixed salt — key file is the secret

export interface StoredCredential {
  service: string;
  name: string;
  value: string;
  type: string;
  stored_at: string;
}

/** Encrypted on-disk format */
interface EncryptedCredential {
  service: string;
  name: string;
  encrypted: string; // base64(iv + authTag + ciphertext)
  type: string;
  stored_at: string;
}

function ensureDir(): void {
  if (!existsSync(UBC_DIR)) {
    mkdirSync(UBC_DIR, { recursive: true, mode: 0o700 });
  }
  if (!existsSync(CREDS_DIR)) {
    mkdirSync(CREDS_DIR, { recursive: true, mode: 0o700 });
  }
}

/** Get or create the encryption key. Key file is mode 0600. */
function getEncryptionKey(): Buffer {
  ensureDir();
  if (existsSync(KEY_FILE)) {
    const raw = readFileSync(KEY_FILE, "utf-8").trim();
    return scryptSync(raw, SALT, KEY_LENGTH);
  }
  // Generate a new key on first use
  const secret = randomBytes(32).toString("hex");
  writeFileSync(KEY_FILE, secret, { encoding: "utf-8", mode: 0o600 });
  chmodSync(KEY_FILE, 0o600); // ensure permissions even if umask interfered
  return scryptSync(secret, SALT, KEY_LENGTH);
}

function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Pack as: iv (16) + authTag (16) + ciphertext
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

function decrypt(packed: string): string {
  const key = getEncryptionKey();
  const buf = Buffer.from(packed, "base64");
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext) + decipher.final("utf-8");
}

/**
 * Detect whether a credential file is legacy plaintext (has "value" field)
 * or encrypted (has "encrypted" field). Transparently migrate plaintext on read.
 */
function readCredentialFile(filepath: string): StoredCredential {
  const raw = readFileSync(filepath, "utf-8");
  const parsed = JSON.parse(raw);

  if ("value" in parsed && !("encrypted" in parsed)) {
    // Legacy plaintext file — migrate to encrypted in place
    const cred: StoredCredential = parsed as StoredCredential;
    writeEncryptedCredential(filepath, cred);
    return cred;
  }

  // Encrypted format
  const enc = parsed as EncryptedCredential;
  return {
    service: enc.service,
    name: enc.name,
    value: decrypt(enc.encrypted),
    type: enc.type,
    stored_at: enc.stored_at,
  };
}

function writeEncryptedCredential(filepath: string, cred: StoredCredential): void {
  const enc: EncryptedCredential = {
    service: cred.service,
    name: cred.name,
    encrypted: encrypt(cred.value),
    type: cred.type,
    stored_at: cred.stored_at,
  };
  writeFileSync(filepath, JSON.stringify(enc, null, 2), { encoding: "utf-8", mode: 0o600 });
  chmodSync(filepath, 0o600); // ensure permissions even if umask interfered
}

export function storeCredential(
  service: string,
  name: string,
  value: string,
  type: string
): void {
  ensureDir();
  const cred: StoredCredential = {
    service,
    name,
    value,
    type,
    stored_at: new Date().toISOString(),
  };
  const filename = `${service.toLowerCase()}_${name.toLowerCase()}.json`;
  writeEncryptedCredential(join(CREDS_DIR, filename), cred);
  addCredentialToState(service, name);
}

export function getCredentials(service?: string): StoredCredential[] {
  ensureDir();
  const files = readdirSync(CREDS_DIR).filter((f) => f.endsWith(".json"));
  const creds: StoredCredential[] = [];

  for (const f of files) {
    try {
      creds.push(readCredentialFile(join(CREDS_DIR, f)));
    } catch {
      // Skip files that can't be decrypted (e.g. corrupted or wrong key)
      continue;
    }
  }

  if (service) {
    return creds.filter((c) => c.service.toLowerCase() === service.toLowerCase());
  }
  return creds;
}

export function getCredential(service: string, name: string): StoredCredential | null {
  const creds = getCredentials(service);
  return creds.find((c) => c.name === name) ?? null;
}
