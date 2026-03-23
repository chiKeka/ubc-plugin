/**
 * Playwright MCP server configuration.
 * Uses @playwright/mcp for browser automation via accessibility tree.
 */

import type { McpServerConfig } from "@anthropic-ai/claude-agent-sdk";

export function getPlaywrightMcpConfig(headed = false): McpServerConfig {
  const args = ["@playwright/mcp@latest"];
  if (!headed) {
    args.push("--headless");
  }

  return {
    type: "stdio" as const,
    command: "npx",
    args,
  };
}
