import { Command } from "commander";
import { getApiKey } from "../lib/config.js";

export const catalogCommand = new Command("catalog")
  .description("Manage the UBCI service catalog");

catalogCommand
  .command("list")
  .description("List all services in the catalog")
  .action(async () => {
    // TODO: Query compute_sources table
    console.log("UBCI Service Catalog");
    console.log("====================");
    console.log("1. GitHub        — cloud_infrastructure — CI/CD, repos, Codespaces");
    console.log("2. Vercel        — cloud_infrastructure — Hosting, serverless");
    console.log("3. Supabase      — cloud_infrastructure — Postgres, Auth, Edge Functions");
    console.log("4. OpenAI API    — ai_llm              — GPT, embeddings, DALL-E");
    console.log("5. Cloudflare    — cloud_infrastructure — CDN, Workers, R2, D1");
  });

catalogCommand
  .command("update")
  .description("Refresh service catalog by scraping pricing pages")
  .option("-s, --service <name>", "Update a specific service only")
  .option("-m, --model <model>", "Model to use", "claude-sonnet-4-6-20250514")
  .action(async (opts) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.error("No Anthropic API key. Run: ubc config set anthropic_api_key <key>");
      process.exit(1);
    }

    const target = opts.service ?? "all";
    console.log(`\nUpdating catalog: ${target}\n`);
    const { runCatalogUpdater } = await import("../agents/catalog-updater.js");
    await runCatalogUpdater({ service: opts.service, model: opts.model });
  });

catalogCommand
  .command("discover")
  .description("Search for new free-tier services not yet in the catalog")
  .action(async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.error("No Anthropic API key. Run: ubc config set anthropic_api_key <key>");
      process.exit(1);
    }
    console.log("\nDiscovering new free-tier services...");
    const { runCatalogUpdater } = await import("../agents/catalog-updater.js");
    await runCatalogUpdater({ discover: true });
  });

catalogCommand
  .command("validate")
  .description("Test all signup templates against live sites")
  .action(async () => {
    console.log("Validating signup templates... (Phase 4)");
  });

catalogCommand
  .command("diff")
  .description("Show changes since last catalog update")
  .action(async () => {
    console.log("Catalog changes (Phase 2 — query change_log table)");
  });
