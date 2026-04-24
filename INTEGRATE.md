# Integrate Bricolage into any MCP runtime

Bricolage ships as a standards-compliant **Model Context Protocol** (MCP) server over stdio. Any runtime that speaks MCP can use it: **OpenClaw, ZeroClaw, Claude Desktop, Claude Code, Cursor, Codex**, or a custom HTTP harness.

This document is the wire-level contract. If your runtime can spawn a child process and exchange newline-delimited JSON-RPC 2.0 messages, you are ninety seconds from a working integration.

---

## 1. Prerequisites

- Node.js **≥ 20** on the host that will run the MCP server
- `npm install` inside the Bricolage repo (produces `node_modules/`; dev deps include `tsx` which executes the TypeScript source directly — no build step)
- No long-running daemon is required. The server is spawned on demand by the runtime and exits when stdin closes.

---

## 2. The one-file config

Every mainstream MCP client takes a config block of this shape:

```json
{
  "mcpServers": {
    "bricolage": {
      "command": "npx",
      "args": ["tsx", "tools/src/index.ts"],
      "cwd": "/absolute/path/to/bricolage"
    }
  }
}
```

Put it wherever the runtime reads server definitions from:

| Runtime | File |
|---|---|
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) |
| Claude Code | `.claude/mcp.json` at the project root |
| Cursor | `~/.cursor/mcp.json` or `.cursor/mcp.json` |
| Codex | `~/.codex/mcp.json` |
| OpenClaw | runtime-specific; supply the block to your OpenClaw orchestrator as an `mcpServers` entry |
| ZeroClaw | as OpenClaw — any ZeroClaw deployment that honours `mcpServers` can consume this |

No other Bricolage-specific setup is required. The server reads `domains/`, `.ubc/`, and `protocol/` relative to `cwd`.

---

## 3. The wire protocol (what the runtime actually does)

Three messages and you are done. Every line below is a real exchange captured from `npm test`.

### Request: initialize

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": { "name": "your-runtime", "version": "1" }
  }
}
```

### Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools":     { "listChanged": true },
      "resources": { "listChanged": true }
    },
    "serverInfo": { "name": "bricolage-tools", "version": "0.4.0" }
  }
}
```

### Follow-up (required by the MCP spec)

```json
{ "jsonrpc": "2.0", "method": "notifications/initialized" }
```

### Then list the tools

```json
{ "jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {} }
```

The response is an array of 15 tool definitions (10 current + 5 legacy aliases), each with a complete JSON Schema. Feed that directly into whatever schema-aware planner your runtime has.

---

## 4. The 10 tools your runtime will use

| Call | Purpose |
|---|---|
| `ubc_domains` | List available domains and their `trust_level` |
| `ubc_catalog { domain, category?, search?, exclude_stale? }` | Browse or search resources |
| `ubc_patterns { domain }` | List known-good resource combinations |
| `ubc_pattern_detail { domain, pattern_id }` | Full blueprint for one pattern |
| `ubc_resource_guide { domain, resource }` | Step-by-step signup + credential capture |
| `ubc_store_access { domain, resource, name, value, type }` | Encrypt + persist a token; regex-validated against the detailed guide |
| `ubc_get_access { domain, resource?, reveal? }` | Read back masked or in plaintext (`reveal=true` is audited) |
| `ubc_status { domain? }` | Inspect what the project has acquired |
| `ubc_update_status { domain, resource, status }` | Mark a resource ready/failed |
| `ubc_create_domain { id, name, description, … }` | Scaffold a new domain at `trust_level: user_scaffolded` |

See `skills/bricolage/SKILL.md` and `tools/src/index.ts` for full schemas.

---

## 5. Invoking a tool

```json
{
  "jsonrpc": "2.0",
  "id": 42,
  "method": "tools/call",
  "params": {
    "name": "ubc_patterns",
    "arguments": { "domain": "compute" }
  }
}
```

The response `result.content[0].text` is a JSON string you parse client-side. This is standard MCP — Bricolage does not introduce any custom payload shape.

---

## 6. HTTP runtimes: the stdio shim

If your agent runtime speaks HTTP rather than stdio (common for ZeroClaw-style deployments or remote-hosted agents), add a ~40-line shim:

```typescript
// http-to-stdio-shim.ts — sketch
import { spawn } from "node:child_process";

const bricolage = spawn("npx", ["tsx", "tools/src/index.ts"], {
  cwd: process.env.BRICOLAGE_PATH,
  stdio: ["pipe", "pipe", "pipe"],
});

// POST /mcp  → write body + newline to bricolage.stdin
// stream bricolage.stdout lines back as the response
```

For production deployments prefer the SDK's native transport layer rather than a hand-rolled shim; `@modelcontextprotocol/sdk/server` exports an `InMemoryTransport` and an HTTP-compatible transport you can compose instead of `StdioServerTransport`.

---

## 7. What ends up on disk

All state is confined to `.ubc/` inside the repo (gitignored):

| Path | Mode | Written by |
|---|---|---|
| `.ubc/.key` | 0600 | First `ubc_store_access`; holds a 32-byte random secret |
| `.ubc/access/{domain}/{resource}_{name}.json` | 0600 | Each `ubc_store_access`; AES-256-GCM ciphertext (base64, per-token IV + auth tag) |
| `.ubc/state.json` | 0600 | `ubc_update_status`, `ubc_store_access` |
| `.ubc/audit.log` | 0600 | Every store, reveal, reject, and domain-create event |
| `domains/{id}/…` | 0755 / 0644 | `ubc_create_domain` |

The runtime does not need write access to anything outside `.ubc/` and `domains/` for normal operation.

---

## 8. Verifying the integration

After wiring the config into your runtime, ask it to call `ubc_domains`. A correct response looks like:

```json
[
  {
    "id": "compute",
    "name": "Cloud Compute",
    "description": "Free-tier cloud services …",
    "trust_level": "blessed",
    "verified_at": "2026-03-23"
  }
]
```

If you get that, the integration is done. Run the Bricolage test suite (`npm test`) in the same checkout to confirm the server itself is healthy.

---

## 9. Ordering contract

**MCP treats requests as independent.** The server does not promise that request N+1 will see the side effects of request N if request N+1 was sent before request N's response was received. This is how the protocol is designed, not a quirk of this implementation.

In practice this matters for `ubc_store_access` → `ubc_get_access` sequences. The client **must await the store response before issuing the get** if it expects the get to see the stored token. The Bricolage server maintains an internal per-domain mutex to serialize reads and writes to the access store, which guarantees that once a store response comes back, the on-disk state is fully consistent. It cannot guarantee cross-request consistency before that response.

Every well-behaved MCP client (Claude Desktop, Claude Code, Cursor, Codex, the SDK's own request primitives) already awaits responses. Custom HTTP shims or runtimes that pipeline requests over a single session must do the same for state-mutating sequences.

---

## 10. Troubleshooting

**`npx tsx` is slow on cold start.** Expected — it compiles TypeScript on the fly. Keep the server alive for the session rather than spawning per tool call. `Claude Desktop` and `Claude Code` already do this; custom runtimes should too.

**`Cannot find module` on first run.** You forgot `npm install`. The server's dependencies (`@modelcontextprotocol/sdk`, `yaml`, `zod`, `tsx`) are in `package.json`.

**`Domain "xyz" not found`.** The `domain` parameter must match an `id` in a registered domain. Call `ubc_domains` to see what exists.

**Token-shape validation rejects a legitimate key.** The regex comes from the detailed guide at `domains/compute/resources/<resource>.yaml` under `credentials[].validation`. If the provider has changed their key format, open a PR against that file.

**Stale catalog entries.** Pass `exclude_stale: true` to `ubc_catalog` to filter out resources whose `verified_at` is older than 180 days.

---

## 11. Security contract (read before shipping)

See `SECURITY.md`. The short version:

- Tokens are encrypted at rest against filesystem-copy attackers.
- Tokens are **not** protected against any agent you connect to this MCP server — that agent can always call `ubc_get_access reveal=true`. This is inherent to MCP and logged in `.ubc/audit.log`.
- Do not point Bricolage agents at untrusted web content without human review; a prompt injection can ask the agent to exfiltrate tokens the same way any tool can.

If your runtime routes untrusted content into tool-calling agents, add an allow-list for `ubc_get_access` at the runtime layer.
