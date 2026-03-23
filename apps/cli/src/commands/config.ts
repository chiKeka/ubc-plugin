import { Command } from "commander";
import { loadConfig, setConfigValue, type UBCConfig } from "../lib/config.js";

const VALID_KEYS: (keyof UBCConfig)[] = [
  "anthropic_api_key",
  "supabase_url",
  "supabase_anon_key",
  "default_model",
  "max_budget_usd",
  "catalog_update_schedule",
];

export const configCommand = new Command("config")
  .description("Manage UBC CLI configuration");

configCommand
  .command("set <key> <value>")
  .description("Set a configuration value")
  .action((key: string, value: string) => {
    if (!VALID_KEYS.includes(key as keyof UBCConfig)) {
      console.error(`Unknown config key: ${key}`);
      console.error(`Valid keys: ${VALID_KEYS.join(", ")}`);
      process.exit(1);
    }
    const typedKey = key as keyof UBCConfig;
    if (typedKey === "max_budget_usd") {
      setConfigValue(typedKey, parseFloat(value));
    } else {
      setConfigValue(typedKey, value);
    }
    const masked = key.includes("key") ? value.slice(0, 8) + "..." : value;
    console.log(`Set ${key} = ${masked}`);
  });

configCommand
  .command("get [key]")
  .description("Get a configuration value (or all values)")
  .action((key?: string) => {
    const config = loadConfig();
    if (key) {
      const val = config[key as keyof UBCConfig];
      if (val === undefined) {
        console.log(`${key}: (not set)`);
      } else {
        const masked = key.includes("key") ? String(val).slice(0, 8) + "..." : val;
        console.log(`${key}: ${masked}`);
      }
    } else {
      for (const k of VALID_KEYS) {
        const val = config[k];
        if (val !== undefined) {
          const masked = k.includes("key") ? String(val).slice(0, 8) + "..." : val;
          console.log(`${k}: ${masked}`);
        } else {
          console.log(`${k}: (not set)`);
        }
      }
    }
  });
