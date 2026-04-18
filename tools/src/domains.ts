/**
 * Domain management — discovers, loads, and scaffolds Bricolage domains.
 *
 * Each domain is a directory under /domains/ containing:
 *   domain.yaml       — descriptor (id, name, description, categories, trust_level)
 *   resources/         — resource catalog + detailed guides
 *   patterns/          — assembly patterns
 *
 * Every domain descriptor is validated against DomainSchema at load
 * time. Invalid descriptors are logged and skipped rather than silently
 * accepted, which is what keeps the protocol load-bearing.
 *
 * The trust_level field distinguishes "blessed" domains that ship with
 * the plugin from "user_scaffolded" domains created locally by the
 * discovery agent. Callers can use this to warn users before treating
 * unreviewed content as authoritative.
 */

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse, stringify } from "yaml";
import { DomainSchema, type Domain, type TrustLevel } from "./schemas.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOMAINS_DIR = join(__dirname, "..", "..", "domains");

/**
 * Kept for backward compatibility with imports. The canonical type is
 * now Domain from ./schemas.ts.
 */
export type DomainDescriptor = Domain;

export function domainsDir(): string {
  return DOMAINS_DIR;
}

export function domainDir(domain: string): string {
  return join(DOMAINS_DIR, domain);
}

export function domainResourcesDir(domain: string): string {
  return join(DOMAINS_DIR, domain, "resources");
}

export function domainPatternsDir(domain: string): string {
  return join(DOMAINS_DIR, domain, "patterns");
}

function loadDescriptorFile(id: string): Domain | null {
  const file = join(DOMAINS_DIR, id, "domain.yaml");
  if (!existsSync(file)) return null;
  try {
    const raw = readFileSync(file, "utf-8");
    const parsed = parse(raw);
    const result = DomainSchema.safeParse(parsed);
    if (!result.success) {
      console.error(
        `[ubc] invalid domain descriptor ${id}/domain.yaml:\n  - ${result.error.issues
          .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
          .join("\n  - ")}`
      );
      return null;
    }
    return result.data;
  } catch (err) {
    console.error(`[ubc] failed to read ${id}/domain.yaml:`, err);
    return null;
  }
}

/** List all registered domains by scanning domains/ subdirectories. */
export function listDomains(): Domain[] {
  if (!existsSync(DOMAINS_DIR)) return [];

  return readdirSync(DOMAINS_DIR)
    .filter((d) => {
      const p = join(DOMAINS_DIR, d);
      return statSync(p).isDirectory() && existsSync(join(p, "domain.yaml"));
    })
    .map((d) => loadDescriptorFile(d))
    .filter((d): d is Domain => d !== null);
}

/** Load a specific domain descriptor. */
export function getDomain(id: string): Domain | null {
  return loadDescriptorFile(id);
}

/** Validate that a domain exists and parses correctly. Returns the id or null. */
export function validateDomain(domain: string): string | null {
  return getDomain(domain) ? domain : null;
}

/** Scaffold a new empty domain. Creates directory structure + domain.yaml. */
export function scaffoldDomain(
  id: string,
  name: string,
  description: string,
  categories?: string[],
  resourceTypes?: string[],
  accessTypes?: string[],
  assemblyVerbs?: string[],
  outcomeTypes?: string[],
  trustLevel: TrustLevel = "user_scaffolded"
): Domain {
  const dir = join(DOMAINS_DIR, id);
  const resourcesDir = join(dir, "resources");
  const patternsDir = join(dir, "patterns");

  // Validate the proposed descriptor *before* touching the filesystem.
  // This ensures scaffoldDomain can't produce an unloadable domain.
  const proposed: Domain = DomainSchema.parse({
    id,
    name,
    description,
    version: "0.1.0",
    created_at: new Date().toISOString().split("T")[0],
    categories: categories ?? [],
    resource_types: resourceTypes ?? [],
    access_types: accessTypes ?? [],
    assembly_verbs: assemblyVerbs ?? [],
    outcome_types: outcomeTypes ?? [],
    maintainer: "discovery",
    trust_level: trustLevel,
  });

  mkdirSync(resourcesDir, { recursive: true });
  mkdirSync(patternsDir, { recursive: true });

  writeFileSync(join(dir, "domain.yaml"), stringify(proposed), "utf-8");

  // Create empty catalog
  writeFileSync(
    join(resourcesDir, "catalog.yaml"),
    "# Resources will be added by the discovery agent\n[]",
    "utf-8"
  );

  return proposed;
}
