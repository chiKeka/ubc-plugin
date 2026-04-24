/**
 * MCP handshake + tool-list smoke test.
 *
 * Spawns the real server over stdio, exchanges the standard
 * initialize/tools/list messages, and asserts the published
 * capabilities and tool count. This is the bar any downstream runtime
 * (OpenClaw, ZeroClaw, Claude Code, Cursor, Codex) has to clear to
 * consume the protocol.
 */

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

interface RpcResponse {
  id?: number;
  result?: any;
  error?: any;
  jsonrpc: string;
}

/**
 * Spawn the MCP server, pipe in an initialize + tools/list sequence,
 * collect responses until both request IDs have answered, then shut
 * down the child.
 */
function speakToServer(): Promise<Map<number, RpcResponse>> {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["tsx", "tools/src/index.ts"], {
      cwd: REPO_ROOT,
      stdio: ["pipe", "pipe", "pipe"],
    });

    const responses = new Map<number, RpcResponse>();
    let buf = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`timeout; got responses for ids: ${[...responses.keys()].join(",")}`));
    }, 15000);

    child.stdout.on("data", (chunk) => {
      buf += chunk.toString();
      let idx;
      while ((idx = buf.indexOf("\n")) !== -1) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line || !line.startsWith("{")) continue;
        try {
          const obj = JSON.parse(line) as RpcResponse;
          if (typeof obj.id === "number") responses.set(obj.id, obj);
          if (responses.has(1) && responses.has(2)) {
            clearTimeout(timer);
            child.kill();
            resolve(responses);
          }
        } catch {
          /* non-JSON line, ignore */
        }
      }
    });

    child.stderr.on("data", () => {
      /* server prints skip warnings here; we don't fail on them */
    });

    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });

    child.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "mcp-test", version: "1" },
        },
      }) + "\n"
    );
    child.stdin.write(
      JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n"
    );
    child.stdin.write(
      JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }) + "\n"
    );
  });
}

test("MCP server negotiates protocol 2024-11-05 and advertises capabilities", async () => {
  const responses = await speakToServer();
  const init = responses.get(1);
  assert.ok(init, "no response to initialize");
  assert.equal(init!.result.protocolVersion, "2024-11-05");
  assert.equal(init!.result.serverInfo.name, "bricolage-tools");
  assert.ok(init!.result.capabilities.tools, "tools capability missing");
  assert.ok(init!.result.capabilities.resources, "resources capability missing");
});

test("MCP server exposes the expected tool surface", async () => {
  const responses = await speakToServer();
  const list = responses.get(2);
  assert.ok(list, "no response to tools/list");
  const toolNames = list!.result.tools.map((t: any) => t.name).sort();

  // The 10 current tools that every integration depends on:
  const required = [
    "ubc_domains",
    "ubc_create_domain",
    "ubc_catalog",
    "ubc_resource_guide",
    "ubc_patterns",
    "ubc_pattern_detail",
    "ubc_status",
    "ubc_update_status",
    "ubc_store_access",
    "ubc_get_access",
  ];
  for (const name of required) {
    assert.ok(toolNames.includes(name), `missing required tool: ${name}`);
  }

  // Legacy aliases (removing one is a breaking change for v0.2 installs):
  const legacy = [
    "ubc_service_guide",
    "ubc_recipes",
    "ubc_recipe_detail",
    "ubc_store_credential",
    "ubc_get_credentials",
  ];
  for (const name of legacy) {
    assert.ok(toolNames.includes(name), `missing legacy alias: ${name}`);
  }
});
