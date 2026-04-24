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
import { existsSync, rmSync, readdirSync, readFileSync } from "node:fs";
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
