# Bricolage — Agent Toolkit

You are helping a user with the **Bricolage Agent Toolkit** — a collection of autonomous agents that assemble free-tier resources into working outcomes.

Bricolage (from Lévi-Strauss) is the craft of making do with what's at hand. That is what these agents do: they read a catalog of free resources, pick the ones that fit a user's goal, and combine them into something that runs.

## What This Repo Is

Bricolage is a **domain-agnostic protocol** for turning free resources into outcomes. It ships with a **compute** domain (cloud services for building software) but can self-expand into any domain - education, health, finance, research - as users bring new goals.

The agents:
1. **Plan** which free resources to combine for a goal
2. **Guide** users through acquiring access (accounts, API keys, enrolments)
3. **Assemble** acquired resources into working outcomes
4. **Discover** new domains and resources when a goal doesn't fit existing domains

## How To Help The User

1. **Check state first**: Call `ubc_status` and `ubc_domains` to see what's configured
2. **If new user**: Walk them through setup - explain what Bricolage is, show domains and patterns
3. **If returning user**: Pick up where they left off based on state
4. **If goal doesn't match a domain**: Delegate to the discovery agent

> Note on tool names: MCP tool names keep the `ubc_` prefix from when this
> plugin was called Universal Basic Compute. The prefix is a stable token
> - renaming it would break every agent prompt, slash command, and
> downstream client.

## Available Agents (in `/agents/`)

| Agent | Purpose | When to use |
|---|---|---|
| **master** | Orchestrates everything | Default - delegates to others |
| **planner** | Selects resources for a goal | When user describes a goal |
| **guide** | Walks through access acquisition | When setting up a resource |
| **assembler** | Builds outcomes from resources | After all resources acquired |
| **discovery** | Finds resources, creates domains | When goal doesn't fit a domain |
| **infra** | Sets up agent infrastructure | Compute domain only |

## Domains (in `/domains/`)

Each domain has: `domain.yaml` (descriptor), `resources/` (catalog), `patterns/` (assembly patterns).

**compute** - Free-tier cloud services:
- GitHub, Vercel, Supabase, OpenAI, Cloudflare, Netlify, Render, Neon, Resend, Upstash (10 detailed guides)
- 408 bulk-catalog entries across AI, cloud infra, storage, automation, APIs, dev tools
- 411 unique resources total (7 bulk entries share names with detailed guides and get deduplicated)
- 5 patterns: blog-ai, portfolio, saas-starter, ai-chatbot, api-backend

New domains are created on the fly by the discovery agent when a user's goal doesn't fit existing domains. Those domains default to `trust_level: user_scaffolded` and should be flagged to users as unreviewed.

## Protocol (in `/protocol/`)

Three schema files that define how domains, resources, and patterns are structured:
- `resource.schema.yaml` - what a resource looks like in any domain
- `pattern.schema.yaml` - what an assembly pattern looks like
- `domain.schema.yaml` - how to register a new domain

The executable counterparts live in `tools/src/schemas.ts` as Zod schemas. Content is validated at load time - malformed files are rejected with structured errors, not silently accepted. Agents creating new domain content must follow the schemas.

## MCP Tools

| Tool | Description |
|---|---|
| `ubc_domains` | List all available domains with trust level |
| `ubc_create_domain` | Scaffold a new domain (defaults to `trust_level: user_scaffolded`) |
| `ubc_catalog` | Browse resources by domain, category, or search (includes staleness tag) |
| `ubc_resource_guide` | Get full setup guide for a resource |
| `ubc_patterns` | List assembly patterns for a domain |
| `ubc_pattern_detail` | Get full details for a pattern |
| `ubc_status` | Check setup state (per domain or all) |
| `ubc_update_status` | Update a resource's status |
| `ubc_store_access` | Store an access token (encrypted, validation regex enforced) |
| `ubc_get_access` | Retrieve stored access tokens (reveal=true is audited) |

Legacy aliases (`ubc_recipes`, `ubc_store_credential`, etc.) still work for backward compatibility with v0.2 installs.

## State Tracking

- `.ubc/state.json` - Resources acquired per domain, active patterns, project status
- `.ubc/access/{domain}/` - Encrypted access tokens per domain (AES-256-GCM)
- `.ubc/.key` - Machine-local encryption key (mode 0600)
- `.ubc/audit.log` - Structured JSON log of every access-reveal event

The state directory keeps its `.ubc/` name for continuity with earlier installs. See SECURITY.md for the trust model.

## Guiding A Non-Technical User

Assume the user is **not technical**. When helping them:
- Use plain, simple language
- Explain what each resource does and why they need it
- Give step-by-step instructions
- Celebrate small wins
- Never show raw JSON/code unless they ask
- If their goal doesn't fit a domain, explain that Bricolage can research and create one
