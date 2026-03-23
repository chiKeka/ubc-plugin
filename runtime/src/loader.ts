/**
 * Agent Loader — reads agent.yaml definitions and returns structured configs.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = join(__dirname, "..", "..", "agents");
const TOOLS_ENTRY = join(__dirname, "..", "..", "tools", "src", "index.ts");

export interface AgentDefinition {
  name: string;
  description: string;
  system_prompt: string;
  model: string;
  tools: string[];
  delegates_to?: string[];
  max_turns: number;
}

export function loadAgent(agentName: string): AgentDefinition {
  const agentFile = join(AGENTS_DIR, agentName, "agent.yaml");
  if (!existsSync(agentFile)) {
    throw new Error(`Agent "${agentName}" not found at ${agentFile}`);
  }
  const raw = readFileSync(agentFile, "utf-8");
  return parse(raw) as AgentDefinition;
}

export function listAgents(): string[] {
  return readdirSync(AGENTS_DIR).filter((name) => {
    const dir = join(AGENTS_DIR, name);
    return statSync(dir).isDirectory() && existsSync(join(dir, "agent.yaml"));
  });
}

export function getToolsEntryPath(): string {
  return TOOLS_ENTRY;
}
