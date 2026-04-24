/**
 * Access store round-trip tests.
 *
 * These run in-process against the repo's .ubc/ directory. The suite
 * wipes the directory before and after each test so a real install is
 * never clobbered (the `.ubc/` path is gitignored and only holds test
 * data during `npm test`).
 */

import { test, beforeEach, afterEach } from "node:test";
import { strict as assert } from "node:assert";
import { existsSync, rmSync, readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { scryptSync, randomBytes, createCipheriv } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { storeAccess, getAccess, ValidationError } from "../src/access.js";
import { findCredentialValidator } from "../src/catalog.js";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const UBC_DIR = join(REPO_ROOT, ".ubc");

function scrubUbcDir() {
  if (existsSync(UBC_DIR)) rmSync(UBC_DIR, { recursive: true, force: true });
}

beforeEach(scrubUbcDir);
afterEach(scrubUbcDir);

test("store_access rejects a malformed GitHub token via the declared regex", () => {
  const validator = findCredentialValidator("compute", "github", "GITHUB_TOKEN");
  assert.ok(validator, "github detailed guide should declare a GITHUB_TOKEN regex");
  assert.throws(
    () =>
      storeAccess(
        "compute",
        "github",
        "GITHUB_TOKEN",
        "this_is_not_a_real_token",
        "api_key",
        validator ?? undefined
      ),
    ValidationError,
    "malformed token should be rejected with ValidationError"
  );
});

test("store_access + get_access round-trip returns the plaintext", () => {
  const value = "ghp_abcdefghijklmnopqrstuvwxyz0123456789AB".slice(0, 40);
  storeAccess("compute", "github", "GITHUB_TOKEN", value, "api_key", undefined);
  const back = getAccess("compute", "github");
  assert.equal(back.length, 1, "expected exactly one stored token");
  assert.equal(back[0].value, value, "round-trip should return the original plaintext");
});

test("ciphertext on disk does not contain the plaintext token", () => {
  const value = "ghp_abcdefghijklmnopqrstuvwxyz0123456789AB".slice(0, 40);
  storeAccess("compute", "github", "GITHUB_TOKEN", value, "api_key", undefined);
  const files = readdirSync(join(UBC_DIR, "access", "compute"));
  assert.ok(files.length >= 1, "expected at least one access file on disk");
  const contents = readFileSync(join(UBC_DIR, "access", "compute", files[0]), "utf-8");
  assert.ok(contents.includes("\"encrypted\":"), "stored file should contain an encrypted field");
  assert.ok(!contents.includes(value), "stored file must not contain the plaintext token");
});

test("legacy install (no .salt, hardcoded salt) still decrypts via backward-compat path", () => {
  // Reproduce the pre-v0.5 on-disk layout: a .key file exists, a .salt
  // file does NOT. The key was derived with the hardcoded
  // "ubc-credential-store" salt. We write a legacy ciphertext file
  // directly, then confirm getAccess still decrypts it.
  const LEGACY_SALT = Buffer.from("ubc-credential-store", "utf-8");
  const value = "ghp_LEGACYabcdefghijklmnopqrstuvwxyz012345".slice(0, 40);

  mkdirSync(join(UBC_DIR, "access", "compute"), { recursive: true, mode: 0o700 });
  // Write the random secret that pre-v0.5 stored as hex at .ubc/.key.
  const secret = randomBytes(32).toString("hex");
  writeFileSync(join(UBC_DIR, ".key"), secret, { mode: 0o600 });
  // Deliberately do NOT write .salt. getSalt() should fall back to
  // LEGACY_STATIC_SALT when .key exists and .salt does not.
  const key = scryptSync(secret, LEGACY_SALT, 32);
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
  const ciphertext = Buffer.concat([cipher.update(value, "utf-8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const packed = Buffer.concat([iv, authTag, ciphertext]).toString("base64");
  writeFileSync(
    join(UBC_DIR, "access", "compute", "github_github_token.json"),
    JSON.stringify(
      {
        service: "github",
        name: "GITHUB_TOKEN",
        encrypted: packed,
        type: "api_key",
        stored_at: new Date().toISOString(),
      },
      null,
      2
    ),
    { mode: 0o600 }
  );

  const back = getAccess("compute", "github");
  assert.equal(back.length, 1, "legacy ciphertext should still decrypt");
  assert.equal(back[0].value, value, "decrypted value should match the legacy plaintext");
  assert.ok(!existsSync(join(UBC_DIR, ".salt")), ".salt should NOT be auto-created for legacy installs");
});

test("fresh install writes a random per-install salt to .ubc/.salt", () => {
  // No .key, no .salt. First storeAccess should create both.
  const value = "ghp_abcdefghijklmnopqrstuvwxyz0123456789AB".slice(0, 40);
  storeAccess("compute", "github", "GITHUB_TOKEN", value, "api_key", undefined);
  assert.ok(existsSync(join(UBC_DIR, ".key")), "fresh install should create .key");
  assert.ok(existsSync(join(UBC_DIR, ".salt")), "fresh install should create .salt");
  const salt = readFileSync(join(UBC_DIR, ".salt"));
  assert.equal(salt.length, 16, ".salt should be 16 random bytes");
  // Two fresh installs should produce different salts.
  const first = Buffer.from(salt);
  scrubUbcDir();
  storeAccess("compute", "github", "GITHUB_TOKEN", value, "api_key", undefined);
  const second = readFileSync(join(UBC_DIR, ".salt"));
  assert.notDeepEqual(first, second, "two fresh installs should generate distinct random salts");
});
