#!/usr/bin/env node
/**
 * UBC Agent Runtime
 *
 * Entry point: `npx ubc` or `node --import tsx/esm runtime/src/index.ts`
 *
 * Loads agent definitions from /agents/ and runs them via the Claude Agent SDK.
 */

import { Command } from "commander";
import { loadAgent, listAgents } from "./loader.js";
import { runAgent } from "./adapters/claude-code.js";

const program = new Command();

program
  .name("ubc")
  .version("0.2.0")
  .description("Universal Basic Compute — DIY Agent Toolkit");

program
  .command("start")
  .description("Start the master agent (interactive)")
  .option("-a, --agent <name>", "Run a specific agent instead of master", "master")
  .argument("[prompt...]", "Optional initial prompt")
  .action(async (promptParts: string[], opts) => {
    const agentName = opts.agent;
    const prompt = promptParts.length > 0
      ? promptParts.join(" ")
      : "Hello! I'm ready to help. What would you like to build today?";

    try {
      const agentDef = loadAgent(agentName);
      console.log(`\n  UBC Agent: ${agentDef.name}`);
      console.log(`  ${agentDef.description}\n`);
      await runAgent(agentDef, prompt);
    } catch (err) {
      console.error(`Failed to start agent "${agentName}":`, (err as Error).message);
      process.exit(1);
    }
  });

program
  .command("agents")
  .description("List all available agents")
  .action(() => {
    const agents = listAgents();
    console.log("\n  Available UBC Agents:\n");
    for (const name of agents) {
      try {
        const def = loadAgent(name);
        const pad = name.padEnd(14);
        console.log(`  ${pad} ${def.description.split("\n")[0].trim()}`);
      } catch {
        console.log(`  ${name.padEnd(14)} (failed to load)`);
      }
    }
    console.log();
  });

program
  .command("run")
  .description("Run an agent with a specific prompt")
  .argument("<agent>", "Agent name (master, planner, provisioner, assembler, catalog, infra)")
  .argument("<prompt...>", "The prompt to send to the agent")
  .action(async (agentName: string, promptParts: string[]) => {
    const prompt = promptParts.join(" ");
    try {
      const agentDef = loadAgent(agentName);
      console.log(`\n  Running: ${agentDef.name}\n`);
      await runAgent(agentDef, prompt);
    } catch (err) {
      console.error(`Failed to run agent "${agentName}":`, (err as Error).message);
      process.exit(1);
    }
  });

// Default action: start master agent
program.action(async () => {
  try {
    const agentDef = loadAgent("master");
    console.log(`\n  Universal Basic Compute — Agent Toolkit`);
    console.log(`  ========================================\n`);
    console.log(`  Starting ${agentDef.name}...\n`);
    await runAgent(agentDef, "Hello! I'm ready to help. What would you like to build today?");
  } catch (err) {
    console.error("Failed to start:", (err as Error).message);
    console.error("Run 'ubc agents' to see available agents.");
    process.exit(1);
  }
});

program.parse();
