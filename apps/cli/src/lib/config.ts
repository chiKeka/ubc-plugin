/**
 * CLI configuration management.
 * Stores user config (API key, defaults) in ~/.ubcrc as JSON.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CONFIG_PATH = join(homedir(), ".ubcrc");

export interface UBCConfig {
  anthropic_api_key?: string;
  supabase_url?: string;
  supabase_anon_key?: string;
  default_model?: string;
  max_budget_usd?: number;
  catalog_update_schedule?: string;
}

export function loadConfig(): UBCConfig {
  if (!existsSync(CONFIG_PATH)) {
    return {};
  }
  const raw = readFileSync(CONFIG_PATH, "utf-8");
  return JSON.parse(raw) as UBCConfig;
}

export function saveConfig(config: UBCConfig): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export function getConfigValue<K extends keyof UBCConfig>(key: K): UBCConfig[K] {
  const config = loadConfig();
  return config[key];
}

export function setConfigValue<K extends keyof UBCConfig>(
  key: K,
  value: UBCConfig[K]
): void {
  const config = loadConfig();
  config[key] = value;
  saveConfig(config);
}

/**
 * Get the Anthropic API key from config or environment.
 * Environment variable takes precedence.
 */
export function getApiKey(): string | undefined {
  return process.env["ANTHROPIC_API_KEY"] ?? getConfigValue("anthropic_api_key");
}
