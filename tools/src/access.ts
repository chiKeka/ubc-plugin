/**
 * Access storage — stores access tokens/credentials locally in .ubc/access/{domain}/
 *
 * Generalized from credentials.ts to handle any access type:
 *   API keys, enrollment IDs, account bookmarks, certificates, etc.
 *
 * Encrypted with AES-256-GCM using a machine-local key.
 * The key is generated on first use and stored in .ubc/.key (mode 0600).
 * Access files are stored with mode 0600 (owner-only read/write).
 *
 * SECURITY MODEL (read SECURITY.md in repo root):
 *   The encryption defends against offline file-copy attacks. It does
 *   NOT defend against an agent that is already running with this MCP
 *   server — any such agent can call ubc_get_access with reveal=true
 *   and see every token in plaintext. That is why reveal events are
 *   written to .ubc/audit.log, so you can see what looked at what.
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  chmodSync,
  appendFileSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from "node:crypto";
import { addAccessToState } from "./state.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UBC_DIR = join(__dirname, "..", "..", ".ubc");
const KEY_FILE = join(UBC_DIR, ".key");
const SALT_FILE = join(UBC_DIR, ".salt");
const AUDIT_LOG = join(UBC_DIR, "audit.log");
const LEGACY_CREDS_DIR = join(UBC_DIR, "credentials");

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 16;
/**
 * Pre-v0.5 installs used a hardcoded salt. When `.salt` is missing on
 * disk, we fall back to this value so existing ciphertexts remain
 * decryptable. Fresh installs get a random per-install salt written to
 * `.ubc/.salt` on first key access; that becomes the path every call
 * uses thereafter. There is no forced migration because the static
 * salt posed no practical attack vector (the secret being salted is
 * already 32 random bytes); the fix is about closing the "same
 * hardcoded salt in every install" hygiene issue, not about recovering
 * from a compromise.
 */
const LEGACY_STATIC_SALT = Buffer.from("ubc-credential-store", "utf-8");

export interface StoredAccess {
  service: string;
  name: string;
  value: string;
  type: string;
  stored_at: string;
}

interface EncryptedAccess {
  service: string;
  name: string;
  encrypted: string;
  type: string;
  stored_at: string;
}

function accessDir(domain: string): string {
  return join(UBC_DIR, "access", domain);
}

function ensureUbcDir(): void {
  if (!existsSync(UBC_DIR)) {
    mkdirSync(UBC_DIR, { recursive: true, mode: 0o700 });
  }
}

function ensureDir(domain: string): void {
  ensureUbcDir();
  const dir = accessDir(domain);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
}

/**
 * Resolve the salt used for scrypt key derivation.
 *
 * - If `.ubc/.salt` exists (v0.5+ install, or migrated), use its bytes.
 * - If `.salt` is missing but `.key` exists (legacy v0.3–v0.4 install),
 *   derive the key with the hardcoded legacy salt so existing tokens
 *   stay readable. We deliberately do NOT auto-create a new `.salt`
 *   for legacy installs: promoting would invalidate every stored token
 *   on next read. Users who want to rotate should explicitly re-enter
 *   their credentials after wiping `.ubc/`.
 * - If neither file exists (fresh install), write a new random 16-byte
 *   salt to `.salt` alongside the key.
 */
function getSalt(): Buffer {
  ensureUbcDir();
  if (existsSync(SALT_FILE)) {
    return readFileSync(SALT_FILE);
  }
  if (existsSync(KEY_FILE)) {
    // Legacy install: .key exists, .salt does not. Keep the old salt.
    return LEGACY_STATIC_SALT;
  }
  const salt = randomBytes(SALT_LENGTH);
  writeFileSync(SALT_FILE, salt, { mode: 0o600 });
  chmodSync(SALT_FILE, 0o600);
  return salt;
}

function getEncryptionKey(): Buffer {
  ensureUbcDir();
  const salt = getSalt();
  if (existsSync(KEY_FILE)) {
    const raw = readFileSync(KEY_FILE, "utf-8").trim();
    return scryptSync(raw, salt, KEY_LENGTH);
  }
  const secret = randomBytes(32).toString("hex");
  writeFileSync(KEY_FILE, secret, { encoding: "utf-8", mode: 0o600 });
  chmodSync(KEY_FILE, 0o600);
  return scryptSync(secret, salt, KEY_LENGTH);
}

function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
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

function readAccessFile(filepath: string): StoredAccess {
  const raw = readFileSync(filepath, "utf-8");
  const parsed = JSON.parse(raw);

  if ("value" in parsed && !("encrypted" in parsed)) {
    const cred: StoredAccess = parsed as StoredAccess;
    writeEncryptedAccess(filepath, cred);
    return cred;
  }

  const enc = parsed as EncryptedAccess;
  return {
    service: enc.service,
    name: enc.name,
    value: decrypt(enc.encrypted),
    type: enc.type,
    stored_at: enc.stored_at,
  };
}

function writeEncryptedAccess(filepath: string, access: StoredAccess): void {
  const enc: EncryptedAccess = {
    service: access.service,
    name: access.name,
    encrypted: encrypt(access.value),
    type: access.type,
    stored_at: access.stored_at,
  };
  writeFileSync(filepath, JSON.stringify(enc, null, 2), { encoding: "utf-8", mode: 0o600 });
  chmodSync(filepath, 0o600);
}

/**
 * ValidationError is thrown by storeAccess when a supplied value fails
 * the resource's declared validation regex. Callers are expected to
 * catch this and surface a clear message; the tool layer does so.
 *
 * The credential name is stored as `credentialName` rather than `name`
 * because `Error.prototype.name` is conventionally the error class name.
 * Using `name` as a parameter property would be shadowed by the
 * `this.name = "ValidationError"` assignment below, losing the value.
 */
export class ValidationError extends Error {
  constructor(
    public readonly resource: string,
    public readonly credentialName: string,
    public readonly pattern: string
  ) {
    super(
      `Value for ${resource}.${credentialName} did not match expected pattern (${pattern}). ` +
        `The resource's catalog entry declares this regex — either the value was pasted into the wrong field, ` +
        `or the resource definition's validation needs updating.`
    );
    this.name = "ValidationError";
  }
}

/**
 * Per-domain FIFO queue for access-store operations.
 *
 * The MCP SDK dispatches concurrent tool calls in parallel, so a rapid
 * store-then-get sequence on the same session can race: the get's
 * readdirSync microtask completes before the store's writeFileSync
 * microtask, returning an empty array even though the file is about to
 * exist. This is observable any time a client does not await the store
 * response before issuing get.
 *
 * storeAccessSerialized and getAccessSerialized route through this
 * queue so every call for a given domain is strictly ordered behind
 * any prior call. The synchronous storeAccess and getAccess exports
 * remain available for internal callers that already control ordering
 * (tests, initialization). The MCP tool handlers in index.ts use the
 * serialized variants.
 *
 * The queue is in-process only; nothing here defends against
 * cross-process races, but Bricolage is single-process by design.
 */
const accessQueues = new Map<string, Promise<void>>();

function enqueue<T>(domain: string, fn: () => T): Promise<T> {
  const prev = accessQueues.get(domain) ?? Promise.resolve();
  const next = prev.then(fn);
  // Silence rejections so a failure in one step does not block the next.
  accessQueues.set(domain, next.then(() => undefined, () => undefined));
  return next;
}

export function storeAccess(
  domain: string,
  resource: string,
  name: string,
  value: string,
  type: string,
  /**
   * Optional validation regex. When present, the value must match
   * before it is encrypted and written. The regex comes from the
   * resource's catalog entry (see catalog.findCredentialValidator).
   */
  validationRegex?: string
): void {
  if (validationRegex) {
    let re: RegExp;
    try {
      re = new RegExp(validationRegex);
    } catch {
      // A malformed regex in the catalog shouldn't block storage —
      // treat it as if no regex were declared, and log the issue.
      console.error(`[ubc] invalid validation regex for ${resource}.${name}: ${validationRegex}`);
      re = /.*/;
    }
    if (!re.test(value)) {
      throw new ValidationError(resource, name, validationRegex);
    }
  }

  ensureDir(domain);
  const access: StoredAccess = {
    service: resource,
    name,
    value,
    type,
    stored_at: new Date().toISOString(),
  };
  const filename = `${resource.toLowerCase()}_${name.toLowerCase()}.json`;
  writeEncryptedAccess(join(accessDir(domain), filename), access);
  addAccessToState(domain, resource, name);
}

function readFromDir(dir: string): StoredAccess[] {
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  const results: StoredAccess[] = [];
  for (const f of files) {
    try {
      results.push(readAccessFile(join(dir, f)));
    } catch {
      continue;
    }
  }
  return results;
}

export function getAccess(domain: string, resource?: string): StoredAccess[] {
  ensureDir(domain);
  let creds = readFromDir(accessDir(domain));

  // Fallback: check legacy credentials/ dir for compute domain
  if (domain === "compute" && creds.length === 0 && existsSync(LEGACY_CREDS_DIR)) {
    creds = readFromDir(LEGACY_CREDS_DIR);
  }

  if (resource) {
    return creds.filter((c) => c.service.toLowerCase() === resource.toLowerCase());
  }
  return creds;
}

/**
 * Serialized wrapper around storeAccess. MCP tool handlers use this so
 * a subsequent getAccessSerialized on the same domain is guaranteed to
 * see the write.
 */
export function storeAccessSerialized(
  domain: string,
  resource: string,
  name: string,
  value: string,
  type: string,
  validationRegex?: string,
  /**
   * Deferred validator lookup. If provided, the queued function calls
   * this inside the queue instead of relying on a pre-resolved regex.
   * Use this when the lookup itself is expensive (cold catalog cache)
   * and you don't want that cost to push your call behind calls that
   * skip the lookup.
   */
  resolveValidator?: () => string | undefined
): Promise<void> {
  return enqueue(domain, () => {
    const regex = resolveValidator ? resolveValidator() : validationRegex;
    return storeAccess(domain, resource, name, value, type, regex);
  });
}

/** Serialized wrapper around getAccess. See storeAccessSerialized. */
export function getAccessSerialized(
  domain: string,
  resource?: string
): Promise<StoredAccess[]> {
  return enqueue(domain, () => getAccess(domain, resource));
}

export function getAccessItem(domain: string, resource: string, name: string): StoredAccess | null {
  const creds = getAccess(domain, resource);
  return creds.find((c) => c.name === name) ?? null;
}

/**
 * Append a structured audit entry to .ubc/audit.log. This is how we
 * make reveal events observable: every plaintext read of a token is
 * logged with a timestamp, the filter that was applied, and how many
 * tokens were returned. The log is owner-readable only.
 *
 * This is deliberately simple — one JSON object per line. Rotation is
 * out of scope; humans inspect it when investigating an incident.
 */
export function recordAudit(event: {
  action: string;
  domain?: string;
  resource?: string;
  count?: number;
  detail?: string;
}): void {
  ensureUbcDir();
  const line =
    JSON.stringify({
      at: new Date().toISOString(),
      ...event,
    }) + "\n";
  try {
    appendFileSync(AUDIT_LOG, line, { encoding: "utf-8", mode: 0o600 });
    // Best-effort mode tighten; ignore if the file already has strict perms.
    try {
      chmodSync(AUDIT_LOG, 0o600);
    } catch {
      /* ignore */
    }
  } catch (err) {
    // Never let audit failure block the caller — just warn.
    console.error("[ubc] could not write audit log:", err);
  }
}
