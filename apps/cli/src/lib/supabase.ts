/**
 * Supabase client for CLI.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadConfig } from "./config.js";

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const config = loadConfig();
  const url = process.env["SUPABASE_URL"] ?? config.supabase_url;
  const key = process.env["SUPABASE_ANON_KEY"] ?? config.supabase_anon_key;

  if (!url || !key) {
    throw new Error(
      "Supabase not configured. Run: ubc config set supabase_url <url> && ubc config set supabase_anon_key <key>"
    );
  }

  client = createClient(url, key);
  return client;
}
