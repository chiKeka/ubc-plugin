/**
 * Template loader — reads YAML service definitions from the /services/ directory.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import type { ServiceTemplate } from "./schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Service definitions live at the repo root /services/
const TEMPLATES_DIR = join(__dirname, "..", "..", "..", "..", "..", "services");

export function loadTemplate(serviceName: string): ServiceTemplate | null {
  const fileName = `${serviceName.toLowerCase()}.yaml`;
  const filePath = join(TEMPLATES_DIR, fileName);

  if (!existsSync(filePath)) {
    return null;
  }

  const raw = readFileSync(filePath, "utf-8");
  return parse(raw) as ServiceTemplate;
}

export function listTemplates(): string[] {
  try {
    const files = readdirSync(TEMPLATES_DIR, "utf-8");
    return files
      .filter((f) => f.endsWith(".yaml") && f !== "catalog.yaml")
      .map((f) => f.replace(".yaml", ""));
  } catch {
    return [];
  }
}
