/**
 * Resource catalog — two-tier system, domain-aware:
 *   Tier 1: Detailed resource definitions (domains/{domain}/resources/*.yaml)
 *   Tier 2: Bulk catalog (domains/{domain}/resources/catalog.yaml)
 *
 * Every load path runs content through Zod schemas (see ./schemas.ts)
 * so the protocol is enforced, not just suggested. Entries that fail
 * validation are skipped with a structured error on stderr.
 *
 * Staleness is tracked via verified_at. Resources whose verification
 * has aged past STALENESS_STALE_DAYS are excluded from pattern planning
 * by default; entries in the "warn" band are surfaced with a tag.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { domainResourcesDir } from "./domains.js";
import {
  ResourceSchema,
  CatalogEntrySchema,
  stalenessLevel,
  type Resource as ResourceZ,
  type CatalogEntry as CatalogEntryZ,
  type StalenessLevel,
} from "./schemas.js";

/** Tier 1: Full resource definition with access guide and credential instructions. */
export type ResourceDefinition = ResourceZ;

/**
 * Tier 2: Lightweight catalog entry returned to callers.
 * Enriched with a staleness tag and an has_detailed_guide flag so
 * consumers don't need to recompute those.
 */
export interface CatalogEntry extends CatalogEntryZ {
  has_detailed_guide: boolean;
  staleness: StalenessLevel;
}

// Domain-keyed caches
const detailedCaches = new Map<string, ResourceDefinition[]>();
const bulkCaches = new Map<string, CatalogEntry[]>();

/** Clear caches for a domain (or all domains). */
export function clearCache(domain?: string): void {
  if (domain) {
    detailedCaches.delete(domain);
    bulkCaches.delete(domain);
  } else {
    detailedCaches.clear();
    bulkCaches.clear();
  }
}

function logSkip(path: string, issues: string[]): void {
  console.error(`[ubc] skipping ${path}:\n  - ${issues.join("\n  - ")}`);
}

/** Load Tier 1 detailed resource definitions for a domain. */
export function loadDetailedResources(domain: string = "compute"): ResourceDefinition[] {
  if (detailedCaches.has(domain)) return detailedCaches.get(domain)!;

  const dir = domainResourcesDir(domain);
  if (!existsSync(dir)) {
    detailedCaches.set(domain, []);
    return [];
  }

  const files = readdirSync(dir).filter(
    (f) => f.endsWith(".yaml") && f !== "catalog.yaml"
  );
  const results: ResourceDefinition[] = [];
  for (const f of files) {
    try {
      const raw = readFileSync(join(dir, f), "utf-8");
      const parsed = parse(raw);
      const result = ResourceSchema.safeParse(parsed);
      if (!result.success) {
        logSkip(
          `${domain}/${f}`,
          result.error.issues.map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
        );
        continue;
      }
      results.push(result.data);
    } catch (err) {
      console.error(`[ubc] failed to parse ${domain}/${f}:`, err);
    }
  }
  detailedCaches.set(domain, results);
  return results;
}

/** Load Tier 2 bulk catalog for a domain. */
export function loadBulkCatalog(domain: string = "compute"): CatalogEntry[] {
  if (bulkCaches.has(domain)) return bulkCaches.get(domain)!;

  const catalogFile = join(domainResourcesDir(domain), "catalog.yaml");
  if (!existsSync(catalogFile)) {
    bulkCaches.set(domain, []);
    return [];
  }

  try {
    const raw = readFileSync(catalogFile, "utf-8");
    const parsed = parse(raw);
    if (!Array.isArray(parsed)) {
      console.error(`[ubc] ${domain}/catalog.yaml did not parse as an array`);
      bulkCaches.set(domain, []);
      return [];
    }

    const detailedNames = new Set(
      loadDetailedResources(domain).map((s) => s.name.toLowerCase())
    );

    const result: CatalogEntry[] = [];
    for (let i = 0; i < parsed.length; i++) {
      const entryRaw = parsed[i];
      const check = CatalogEntrySchema.safeParse(entryRaw);
      if (!check.success) {
        logSkip(
          `${domain}/catalog.yaml[${i}]${entryRaw?.name ? ` (${entryRaw.name})` : ""}`,
          check.error.issues.map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
        );
        continue;
      }
      const entry = check.data;
      result.push({
        ...entry,
        has_detailed_guide: detailedNames.has(entry.name.toLowerCase()),
        staleness: stalenessLevel(entry.verified_at),
      });
    }
    bulkCaches.set(domain, result);
  } catch (err) {
    console.error(`[ubc] failed to parse ${domain}/catalog.yaml:`, err);
    bulkCaches.set(domain, []);
  }

  return bulkCaches.get(domain)!;
}

/**
 * Options for catalog reads.
 *
 * By default, stale resources are still returned (so users can see them
 * and decide) but they are tagged via the `staleness` field. Pattern
 * planning should filter out stale entries with `excludeStale: true`.
 */
export interface LoadOptions {
  excludeStale?: boolean;
}

/** Load ALL resources for a domain (both tiers merged). */
export function loadAllResources(
  domain: string = "compute",
  opts: LoadOptions = {}
): CatalogEntry[] {
  const detailed = loadDetailedResources(domain);
  const bulk = loadBulkCatalog(domain);

  const result: CatalogEntry[] = detailed.map((s) => ({
    name: s.name,
    provider: s.provider,
    category: s.category,
    website: s.website,
    description: s.description,
    free_tier: s.free_tier.map((l) => `${l.name}: ${l.value} ${l.unit}`).join("; "),
    free_tier_type: s.free_tier_type ?? "unknown",
    verified_at: s.verified_at,
    has_detailed_guide: true,
    staleness: stalenessLevel(s.verified_at),
  }));

  const detailedNames = new Set(detailed.map((s) => s.name.toLowerCase()));
  for (const entry of bulk) {
    if (!detailedNames.has(entry.name.toLowerCase())) {
      result.push(entry);
    }
  }

  return opts.excludeStale ? result.filter((r) => r.staleness !== "stale") : result;
}

/** Get a detailed resource definition (Tier 1 only). */
export function loadResource(domain: string = "compute", name: string): ResourceDefinition | null {
  const resources = loadDetailedResources(domain);
  return (
    resources.find(
      (s) =>
        s.name.toLowerCase() === name.toLowerCase() ||
        s.provider.toLowerCase() === name.toLowerCase()
    ) ?? null
  );
}

/** Search across ALL resources for a domain (both tiers). */
export function searchResources(
  domain: string = "compute",
  query: string,
  category?: string,
  opts: LoadOptions = {}
): CatalogEntry[] {
  let all = loadAllResources(domain, opts);
  if (category) {
    all = all.filter((s) => s.category === category);
  }
  if (query) {
    const q = query.toLowerCase();
    all = all.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.provider.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }
  return all;
}

/** Get count by category for a domain. */
export function getCategoryCounts(
  domain: string = "compute",
  opts: LoadOptions = {}
): Record<string, number> {
  const all = loadAllResources(domain, opts);
  const counts: Record<string, number> = {};
  for (const s of all) {
    counts[s.category] = (counts[s.category] ?? 0) + 1;
  }
  return counts;
}

/** Get staleness counts for a domain. Useful for dashboards and audits. */
export function getStalenessCounts(
  domain: string = "compute"
): Record<StalenessLevel, number> {
  const all = loadAllResources(domain);
  const counts: Record<StalenessLevel, number> = {
    fresh: 0,
    warn: 0,
    stale: 0,
    unknown: 0,
  };
  for (const s of all) {
    counts[s.staleness] += 1;
  }
  return counts;
}

/**
 * Look up the validation regex declared for a named credential on a
 * resource. Returns null if no such credential or no regex is declared.
 *
 * This is what the store_access tool uses to reject values that were
 * pasted into the wrong field — e.g. a Stripe key into GITHUB_TOKEN.
 * The check is best-effort: if the resource has no detailed guide, or
 * the guide doesn't declare a regex, validation is skipped.
 */
export function findCredentialValidator(
  domain: string,
  resource: string,
  credentialName: string
): string | null {
  const res = loadResource(domain, resource);
  if (!res || !res.credentials) return null;

  const cred = res.credentials.find(
    (c) =>
      c.name.toLowerCase() === credentialName.toLowerCase() ||
      c.env_var.toLowerCase() === credentialName.toLowerCase()
  );
  return cred?.validation ?? null;
}
