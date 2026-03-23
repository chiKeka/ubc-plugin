import { Command } from "commander";
import { getApiKey } from "../lib/config.js";

export const runCommand = new Command("run")
  .description("Full pipeline: plan services, provision accounts, and assemble project")
  .argument("<goal>", "What you want to build (e.g., 'a blog with AI summarization')")
  .option("-m, --model <model>", "Model to use for orchestration", "claude-sonnet-4-6-20250514")
  .option("--budget <usd>", "Max budget in USD for this run", "2.0")
  .option("--dry-run", "Plan only, don't provision or assemble")
  .action(async (goal: string, opts) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.error("No Anthropic API key configured.");
      console.error("Run: ubc config set anthropic_api_key <your-key>");
      console.error("Or set ANTHROPIC_API_KEY environment variable.");
      process.exit(1);
    }

    console.log(`\nGoal: ${goal}`);
    console.log(`Model: ${opts.model}`);
    console.log(`Budget: $${opts.budget}`);
    if (opts.dryRun) console.log("(dry run — plan only)\n");

    const { createOrchestrator } = await import("../agents/orchestrator.js");
    await createOrchestrator(goal, {
      model: opts.model,
      maxBudgetUsd: parseFloat(opts.budget),
      dryRun: opts.dryRun ?? false,
    });
  });
