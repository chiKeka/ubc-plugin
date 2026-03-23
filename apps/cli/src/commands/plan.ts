import { Command } from "commander";
import { getApiKey } from "../lib/config.js";

export const planCommand = new Command("plan")
  .description("Plan which free-tier services to use for a goal (no provisioning)")
  .argument("<goal>", "What you want to build")
  .option("-m, --model <model>", "Model to use", "claude-sonnet-4-6-20250514")
  .action(async (goal: string, opts) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.error("No Anthropic API key. Run: ubc config set anthropic_api_key <key>");
      process.exit(1);
    }

    console.log(`\nPlanning services for: ${goal}\n`);
    const { runPlanner } = await import("../agents/planner.js");
    await runPlanner(goal, { model: opts.model });
  });
