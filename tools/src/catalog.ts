/**
 * Service catalog — loads service definitions from /services/*.yaml
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVICES_DIR = join(__dirname, "..", "..", "services");

export interface ServiceDefinition {
  name: string;
  provider: string;
  category: string;
  website: string;
  pricing_url: string;
  description: string;
  free_tier: Array<{ name: string; value: number; unit: string; notes?: string }>;
  signup: {
    url: string;
    method: string;
    requires?: string;
    steps: string[];
  };
  credentials: Array<{
    name: string;
    env_var: string;
    type: string;
    optional?: boolean;
    sensitive?: boolean;
    how_to_get: { url: string; steps: string[] };
    validation: string;
  }>;
  provides: string[];
  depends_on: string[];
}

let cache: ServiceDefinition[] | null = null;

export function loadAllServices(): ServiceDefinition[] {
  if (cache) return cache;

  const files = readdirSync(SERVICES_DIR).filter((f) => f.endsWith(".yaml"));
  cache = files.map((f) => {
    const raw = readFileSync(join(SERVICES_DIR, f), "utf-8");
    return parse(raw) as ServiceDefinition;
  });
  return cache;
}

export function loadService(name: string): ServiceDefinition | null {
  const services = loadAllServices();
  return (
    services.find(
      (s) =>
        s.name.toLowerCase() === name.toLowerCase() ||
        s.provider.toLowerCase() === name.toLowerCase()
    ) ?? null
  );
}
