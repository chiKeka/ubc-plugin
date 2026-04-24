/**
 * Catalog integrity tests.
 *
 * These assertions are the load-bearing counterpart to the claim that
 * "the protocol is enforced, not suggested." If any shipped YAML file
 * ever fails to parse through its Zod schema, this test fails.
 */

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { loadAllResources, loadDetailedResources } from "../src/catalog.js";
import { loadAllPatterns } from "../src/patterns.js";
import { listDomains } from "../src/domains.js";

test("at least the compute domain is registered and blessed", () => {
  const domains = listDomains();
  assert.ok(domains.length >= 1, "expected at least one domain");
  const compute = domains.find((d) => d.id === "compute");
  assert.ok(compute, "compute domain must exist");
  assert.equal(compute!.trust_level, "blessed", "compute should ship blessed");
});

test("all shipped compute resources load without schema failures", () => {
  const resources = loadAllResources("compute");
  assert.ok(resources.length > 0, "catalog should have entries");
  for (const r of resources) {
    assert.ok(r.name, `resource is missing name: ${JSON.stringify(r)}`);
    assert.ok(r.free_tier_type, `resource ${r.name} missing free_tier_type`);
  }
});

test("detailed guides declare credentials with validation regexes", () => {
  const detailed = loadDetailedResources("compute");
  assert.ok(detailed.length >= 10, `expected at least 10 detailed guides, got ${detailed.length}`);
  for (const r of detailed) {
    assert.ok(r.verified_at, `detailed guide ${r.name} missing verified_at`);
    const creds = r.credentials ?? [];
    assert.ok(creds.length > 0, `detailed guide ${r.name} should declare credentials`);
    for (const c of creds) {
      assert.ok(c.validation, `credential ${r.name}.${c.name} should declare validation regex`);
      // The regex must compile. A malformed pattern would defeat the "wrong field" check.
      assert.doesNotThrow(() => new RegExp(c.validation!), `validation regex for ${r.name}.${c.name} must compile`);
    }
  }
});

test("all 5 compute patterns load and reference real resources", () => {
  const patterns = loadAllPatterns("compute");
  assert.equal(patterns.length, 5, `expected 5 patterns, got ${patterns.length}`);

  // loadResource matches by name OR provider (case-insensitive), so the
  // resolver will accept e.g. "openai" for a resource whose display name
  // is "OpenAI API" as long as provider is "OpenAI". Mirror that logic.
  const all = loadAllResources("compute");
  const keys = new Set<string>();
  for (const r of all) {
    keys.add(r.name.toLowerCase());
    if (r.provider) keys.add(r.provider.toLowerCase());
  }
  for (const p of patterns) {
    assert.ok(p.id && p.name && p.description, `pattern ${p.id} missing core fields`);
    for (const r of p.resources ?? []) {
      const key = (r.resource ?? "").toLowerCase();
      assert.ok(
        keys.has(key),
        `pattern ${p.id} references unknown resource "${r.resource}" (not found by name or provider)`
      );
    }
  }
});
