/**
 * Assembler Agent — connects provisioned services and scaffolds the project.
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { createUbciMcpServer } from "../mcp/ubci-tools.js";
import { streamAgentOutput } from "../lib/agent-stream.js";

const ASSEMBLER_SYSTEM_PROMPT = `You are the UBC Assembler Agent. Your job is to take provisioned free-tier services and wire them into a working project.

Given a list of provisioned services and their credentials:
1. Create the project directory structure
2. Initialize the project (e.g., npm init, create-next-app)
3. Configure environment variables (.env file with all credentials)
4. Connect services (e.g., Supabase client setup, OpenAI client, Vercel deployment)
5. Write initial code that demonstrates the integration
6. Deploy if possible (vercel deploy, etc.)
7. Run basic smoke tests

Use ubci_get_credential to retrieve stored credentials for each service.
Write clean, minimal code — just enough to prove the integration works.`;

export interface AssemblerOptions {
  model: string;
  projectDir: string;
}

export async function runAssembler(
  projectName: string,
  services: string[],
  options: AssemblerOptions
): Promise<void> {
  const ubciMcp = createUbciMcpServer();

  const result = query({
    prompt: `Assemble a project called "${projectName}" using these provisioned services: ${services.join(", ")}. Create the project in ${options.projectDir}. Retrieve credentials with ubci_get_credential and wire everything together.`,
    options: {
      systemPrompt: ASSEMBLER_SYSTEM_PROMPT,
      model: options.model,
      maxTurns: 100,
      allowedTools: [
        "Read", "Write", "Edit", "Bash", "Glob", "Grep",
        "mcp__ubci__ubci_get_credential",
        "mcp__ubci__ubci_update_project_status",
      ],
      mcpServers: { ubci: ubciMcp },
      permissionMode: "acceptEdits",
    },
  });

  await streamAgentOutput(result);
  console.log();
}
