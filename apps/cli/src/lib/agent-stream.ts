/**
 * Shared helper for streaming agent output to the console.
 */

import type { Query } from "@anthropic-ai/claude-agent-sdk";

export async function streamAgentOutput(result: Query): Promise<void> {
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
    if (message.type === "result") {
      const r = message as Record<string, unknown>;
      if (r["costUSD"]) {
        console.log(`\n[Cost: $${r["costUSD"]}]`);
      }
    }
  }
}
