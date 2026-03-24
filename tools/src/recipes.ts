/**
 * Recipe loader — reads recipe definitions from /recipes/*.yaml
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RECIPES_DIR = join(__dirname, "..", "..", "recipes");

export interface Recipe {
  id: string;
  name: string;
  description: string;
  icon: string;
  services: Array<{ service: string; role: string; reason: string }>;
  builds: {
    framework: string;
    features: string[];
    deploy_to: string;
  };
  estimated_usage: Record<string, string>;
}

let cache: Recipe[] | null = null;

export function loadAllRecipes(): Recipe[] {
  if (cache) return cache;

  const files = readdirSync(RECIPES_DIR).filter((f) => f.endsWith(".yaml"));
  cache = [];
  for (const f of files) {
    try {
      const raw = readFileSync(join(RECIPES_DIR, f), "utf-8");
      const parsed = parse(raw) as Recipe;
      if (parsed && parsed.id && parsed.name) {
        cache.push(parsed);
      } else {
        console.error(`Skipping recipe ${f}: missing required fields (id, name)`);
      }
    } catch (err) {
      console.error(`Failed to parse recipe ${f}:`, err);
    }
  }
  return cache;
}

export function loadRecipe(id: string): Recipe | null {
  const recipes = loadAllRecipes();
  return recipes.find((r) => r.id === id) ?? null;
}
