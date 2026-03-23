import { Command } from "commander";
import { getApiKey } from "../lib/config.js";

export const provisionCommand = new Command("provision")
  .description("Provision a specific service (create account, capture credentials)")
  .argument("<service>", "Service name (e.g., github, vercel, supabase, openai, cloudflare)")
  .option("-m, --model <model>", "Model to use", "claude-sonnet-4-6-20250514")
  .option("--headed", "Run browser in headed mode (visible window)")
  .action(async (service: string, opts) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.error("No Anthropic API key. Run: ubc config set anthropic_api_key <key>");
      process.exit(1);
    }

    console.log(`\nProvisioning: ${service}`);
    console.log(`Mode: ${opts.headed ? "headed (visible)" : "headless"}\n`);
    const { runProvisioner } = await import("../agents/provisioner.js");
    await runProvisioner(service, { model: opts.model, headed: opts.headed ?? false });
  });
