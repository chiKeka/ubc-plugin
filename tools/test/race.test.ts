/**
 * Regression test for the store->get ordering contract.
 *
 * MCP treats requests as independent: the server does not promise that
 * request N+1 sees the side effects of request N if request N+1 is
 * issued before request N's response is received. That is by design of
 * the protocol, not a bug of this implementation.
 *
 * This test pins the contract that DOES hold: if the client awaits the
 * store response before issuing get, the get sees the stored token.
 * The per-domain mutex in access.ts guarantees that a read is never
 * interleaved with a write on the same domain — so once a store
 * response comes back, the disk state is fully consistent for the
 * subsequent get.
 *
 * The fixture: a live MCP server over stdio, a store request, wait for
 * its response, then a get request. Get must return the token.
 */

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const UBC_DIR = join(REPO_ROOT, ".ubc");

test("store->await-response->get returns the just-stored token", async () => {
  if (existsSync(UBC_DIR)) rmSync(UBC_DIR, { recursive: true, force: true });

  try {
    const child = spawn("npx", ["tsx", "tools/src/index.ts"], {
      cwd: REPO_ROOT,
      stdio: ["pipe", "pipe", "pipe"],
    });

    const responses = new Map<number, any>();
    let buf = "";
    child.stdout.on("data", (c) => {
      buf += c.toString();
      let i: number;
      while ((i = buf.indexOf("\n")) !== -1) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith("{")) continue;
        try {
          const obj = JSON.parse(line);
          if (typeof obj.id === "number") responses.set(obj.id, obj);
        } catch {
          /* ignore non-JSON */
        }
      }
    });

    const send = (obj: unknown) => child.stdin.write(JSON.stringify(obj) + "\n");

    const waitFor = async (id: number, timeoutMs = 10_000): Promise<any> => {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        if (responses.has(id)) return responses.get(id);
        await new Promise((r) => setTimeout(r, 25));
      }
      throw new Error(`timed out waiting for response to id=${id}`);
    };

    // Handshake
    send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "race-test", version: "1" },
      },
    });
    await waitFor(1);
    send({ jsonrpc: "2.0", method: "notifications/initialized" });

    const token = "ghp_" + "x".repeat(36);

    // Store, wait for response, then get. This is the contract the
    // server promises and that every well-behaved MCP client follows.
    send({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "ubc_store_access",
        arguments: { domain: "compute", resource: "github", name: "GITHUB_TOKEN", value: token },
      },
    });
    const storeResp = await waitFor(2);
    assert.match(
      storeResp.result.content[0].text,
      /Stored GITHUB_TOKEN/,
      `store should succeed, got ${JSON.stringify(storeResp)}`
    );

    send({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "ubc_get_access",
        arguments: { domain: "compute", resource: "github", reveal: true },
      },
    });
    const getResp = await waitFor(3);
    child.kill();

    const getPayload = JSON.parse(getResp.result.content[0].text);
    assert.ok(
      Array.isArray(getPayload) && getPayload.length === 1,
      `get should see the stored token, got ${JSON.stringify(getPayload)}`
    );
    assert.equal(getPayload[0].value, token, "revealed value should match the stored token");
    assert.equal(getPayload[0].name, "GITHUB_TOKEN");
    assert.equal(getPayload[0].resource, "github");
  } finally {
    if (existsSync(UBC_DIR)) rmSync(UBC_DIR, { recursive: true, force: true });
  }
});
