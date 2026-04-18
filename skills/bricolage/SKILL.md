---
name: Bricolage
description: Assemble free-tier resources into working outcomes across any domain
version: 0.4.0
mcp:
  bricolage:
    command: npx
    args: ["tsx", "tools/src/index.ts"]
---

# Bricolage

Bricolage (from Lévi-Strauss) is the craft of making do with what's at hand. These MCP tools let you help users accomplish goals by scanning a catalog of free resources, picking the ones that fit, and assembling them into something that runs.

## What You Can Do

Use the Bricolage MCP tools to:

1. **List domains**: Call `ubc_domains` to see available resource domains (compute, education, etc.). Every domain carries a `trust_level`; warn the user before treating `user_scaffolded` domains as authoritative.
2. **Browse resources**: Call `ubc_catalog` with a domain to see available free resources. Responses include a `staleness` tag per entry.
3. **Guide setup**: Call `ubc_resource_guide` to get step-by-step access instructions.
4. **Show patterns**: Call `ubc_patterns` to list proven resource combinations for a domain.
5. **Check status**: Call `ubc_status` to see what the user has acquired so far.
6. **Store access**: Call `ubc_store_access` when the user gives you a token or credential. The resource's declared validation regex is enforced before storage.
7. **Track progress**: Call `ubc_update_status` to mark resources as acquired.
8. **Create domains**: Call `ubc_create_domain` when a goal needs a new domain. New domains default to `trust_level: user_scaffolded` - tell the user.

> Tool names keep the `ubc_` prefix from when this plugin was called
> Universal Basic Compute. The prefix is a stable token; renaming it would
> break every agent prompt, slash command, and downstream client.

## How To Help

When a user asks to accomplish something:

1. Call `ubc_domains` to see what domains exist.
2. If their goal fits a domain, call `ubc_patterns` and suggest a matching pattern.
3. Call `ubc_pattern_detail` to see which resources are needed.
4. Call `ubc_status` to check what's already set up.
5. For each missing resource, call `ubc_resource_guide` and walk the user through access.
6. When they give you a token, call `ubc_store_access` to save it.
7. Once all resources are ready, help them build the outcome.

If no domain fits: explain that Bricolage can research and create new domains on the fly, and remind the user that scaffolded content will be marked unreviewed.

## Important Rules

- Always use plain, simple language - assume the user is not technical
- Never direct users to paid plans or billing pages
- Only use free resources
- Prefer resources classified as `cross_subsidy` or `public_good` over `cac_funded` or `trial` when both can achieve the goal
- Be patient - guide them step by step
- Celebrate progress

## Available MCP Tools

| Tool | Description |
|---|---|
| `ubc_domains` | List all available domains with trust level |
| `ubc_create_domain` | Scaffold a new domain (marked user_scaffolded) |
| `ubc_catalog` | Browse resources by domain; returns staleness tag |
| `ubc_resource_guide` | Get full setup guide for a resource |
| `ubc_patterns` | List assembly patterns for a domain |
| `ubc_pattern_detail` | Get details for a specific pattern |
| `ubc_status` | Check current state |
| `ubc_update_status` | Update a resource's status |
| `ubc_store_access` | Store an access token (encrypted, validation regex enforced) |
| `ubc_get_access` | Retrieve stored access tokens (reveal=true is audited) |
