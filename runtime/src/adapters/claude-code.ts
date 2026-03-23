/**
 * Claude Code Adapter — runs UBC agents via the Claude Agent SDK.
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import type { AgentDefinition } from "../loader.js";
import { getToolsEntryPath, loadAgent } from "../loader.js";

export async function runAgent(
  agentDef: AgentDefinition,
  userPrompt: string
): Promise<void> {
  // Build subagent definitions from delegates_to
  const agents: Record<string, { description: string; prompt: string; model: string; maxTurns: number; tools: string[] }> = {};

  if (agentDef.delegates_to) {
    for (const delegateName of agentDef.delegates_to) {
      try {
        const delegate = loadAgent(delegateName);
        agents[delegateName] = {
          description: delegate.description,
          prompt: delegate.system_prompt,
          model: delegate.model === "opus" ? "opus" : "sonnet",
          maxTurns: delegate.max_turns,
          tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "WebSearch", "WebFetch"],
        };
      } catch {
        // Skip agents that can't be loaded
      }
    }
  }

  const hasSubagents = Object.keys(agents).length > 0;

  const result = query({
    prompt: userPrompt,
    options: {
      systemPrompt: agentDef.system_prompt,
      model: agentDef.model,
      maxTurns: agentDef.max_turns,
      allowedTools: [
        "Read", "Write", "Edit", "Bash", "Glob", "Grep",
        "WebSearch", "WebFetch",
        ...(hasSubagents ? ["Agent"] : []),
        // MCP tools
        "mcp__ubc__ubc_catalog",
        "mcp__ubc__ubc_service_guide",
        "mcp__ubc__ubc_recipes",
        "mcp__ubc__ubc_recipe_detail",
        "mcp__ubc__ubc_status",
        "mcp__ubc__ubc_update_status",
        "mcp__ubc__ubc_store_credential",
        "mcp__ubc__ubc_get_credentials",
      ],
      mcpServers: {
        ubc: {
          type: "stdio" as const,
          command: "node",
          args: ["--import", "tsx/esm", getToolsEntryPath()],
        },
      },
      ...(hasSubagents ? { agents } : {}),
      permissionMode: "acceptEdits",
    },
  });

  for await (const message of result) {
    if (message.type === "assistant") {
      const msg = message as { type: string; content: Array<{ type: string; text?: string }> };
      if (msg.content) {
        for (const block of msg.content) {
          if (block.text) {
            process.stdout.write(block.text);
          }
        }
      }
    }
  }
  console.log();
}
