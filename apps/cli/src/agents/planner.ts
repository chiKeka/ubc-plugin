/**
 * Planner Agent — selects optimal free-tier services for a user goal.
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { createUbciMcpServer } from "../mcp/ubci-tools.js";
import { streamAgentOutput } from "../lib/agent-stream.js";

const PLANNER_SYSTEM_PROMPT = `You are the UBC Planner Agent. Given a project goal, you select the optimal combination of free-tier cloud services to achieve it.

Process:
1. Use ubci_query_catalog to browse available services and their limits
2. Analyze the goal's requirements (hosting, database, AI, storage, etc.)
3. Select 3-5 services that together cover all requirements
4. Estimate resource usage against free-tier limits
5. Identify any gaps where free tiers fall short

Output a structured plan with:
- Selected services and their roles
- Estimated daily/monthly usage vs limits
- Gap analysis (where paid might be needed)
- Confidence score (0-1)
- Reasoning for each selection

Be realistic about free-tier limitations. Don't overcommit.`;

export interface PlannerOptions {
  model: string;
}

export async function runPlanner(
  goal: string,
  options: PlannerOptions
): Promise<void> {
  const ubciMcp = createUbciMcpServer();

  const result = query({
    prompt: `Create a compute plan for this project goal: ${goal}`,
    options: {
      systemPrompt: PLANNER_SYSTEM_PROMPT,
      model: options.model,
      maxTurns: 15,
      allowedTools: [
        "Read", "Grep", "Glob", "WebSearch", "WebFetch",
        "mcp__ubci__ubci_query_catalog",
        "mcp__ubci__ubci_get_service_limits",
      ],
      mcpServers: { ubci: ubciMcp },
      permissionMode: "acceptEdits",
    },
  });

  await streamAgentOutput(result);
  console.log();
}
