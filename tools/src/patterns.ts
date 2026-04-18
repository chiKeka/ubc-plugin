/**
 * Pattern loader — reads assembly patterns from domains/{domain}/patterns/*.yaml
 *
 * A pattern is a known-good combination of resources that produces an outcome.
 * Previously called "recipes" — that name is kept as an alias for backward compat.
 *
 * Patterns are validated against PatternSchema at load time. Legacy
 * compute patterns that use "services" instead of "resources" are
 * normalized on read — the caller always sees the new field.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { domainPatternsDir } from "./domains.js";
import { PatternSchema, type Pattern as PatternZ } from "./schemas.js";

/**
 * Kept as a named export for backward-compatible imports. The canonical
 * type is now Pattern from ./schemas.ts.
 */
export type Pattern = PatternZ & {
  resources?: Array<{ resource: string; role: string; reason: string }>;
  services?: Array<{ service: string; role: string; reason: string }>;
};

// Domain-keyed cache
const caches = new Map<string, Pattern[]>();

/** Clear caches for a domain (or all domains). */
export function clearPatternCache(domain?: string): void {
  if (domain) {
    caches.delete(domain);
  } else {
    caches.clear();
  }
}

export function loadAllPatterns(domain: string = "compute"): Pattern[] {
  if (caches.has(domain)) return caches.get(domain)!;

  const dir = domainPatternsDir(domain);
  if (!existsSync(dir)) {
    caches.set(domain, []);
    return [];
  }

  const files = readdirSync(dir).filter((f) => f.endsWith(".yaml"));
  const results: Pattern[] = [];
  for (const f of files) {
    try {
      const raw = readFileSync(join(dir, f), "utf-8");
      const parsed = parse(raw);
      const check = PatternSchema.safeParse(parsed);
      if (!check.success) {
        console.error(
          `[ubc] skipping pattern ${domain}/${f}:\n  - ${check.error.issues
            .map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
            .join("\n  - ")}`
        );
        continue;
      }
      const pattern = check.data as Pattern;

      // Normalize: if legacy "services" field exists but no "resources",
      // project it forward so callers can use the new field unconditionally.
      if (pattern.services && !pattern.resources) {
        pattern.resources = pattern.services.map((s) => ({
          resource: s.service,
          role: s.role,
          reason: s.reason,
        }));
      }

      results.push(pattern);
    } catch (err) {
      console.error(`[ubc] failed to parse pattern ${domain}/${f}:`, err);
    }
  }
  caches.set(domain, results);
  return results;
}

export function loadPattern(domain: string = "compute", id: string): Pattern | null {
  const patterns = loadAllPatterns(domain);
  return patterns.find((r) => r.id === id) ?? null;
}
