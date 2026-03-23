/**
 * Credential storage — stores credentials locally in .ubc/credentials/
 *
 * Phase 1: Plain JSON files (local only, gitignored)
 * Phase 2: AES-256-GCM encrypted storage
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { addCredentialToState } from "./state.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CREDS_DIR = join(__dirname, "..", "..", ".ubc", "credentials");

interface StoredCredential {
  service: string;
  name: string;
  value: string;
  type: string;
  stored_at: string;
}

function ensureDir(): void {
  if (!existsSync(CREDS_DIR)) {
    mkdirSync(CREDS_DIR, { recursive: true });
  }
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
  writeFileSync(join(CREDS_DIR, filename), JSON.stringify(cred, null, 2), "utf-8");
  addCredentialToState(service, name);
}

export function getCredentials(service?: string): StoredCredential[] {
  ensureDir();
  const files = readdirSync(CREDS_DIR).filter((f) => f.endsWith(".json"));
  const creds = files.map((f) => {
    const raw = readFileSync(join(CREDS_DIR, f), "utf-8");
    return JSON.parse(raw) as StoredCredential;
  });
  if (service) {
    return creds.filter((c) => c.service.toLowerCase() === service.toLowerCase());
  }
  return creds;
}

export function getCredential(service: string, name: string): StoredCredential | null {
  const creds = getCredentials(service);
  return creds.find((c) => c.name === name) ?? null;
}
