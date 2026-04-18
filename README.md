# Bricolage

> A Claude Code plugin that turns free resources into working outcomes. Starts with cloud compute; extends into any domain you bring it.

Free-tier services from GitHub, Vercel, Supabase, OpenAI, Cloudflare, and hundreds of others collectively provide enough capacity to build, deploy, and run real applications without paying for infrastructure. Bricolage gives you agents that know which resources exist, how to claim them, and how to combine them into something that runs.

The name is from Lévi-Strauss: **bricolage** is the craft of making do with what's at hand. Scan the available parts, pick the ones that fit the goal, assemble. That is what these agents do.

Bricolage is a **domain-agnostic protocol** for assembling free resources into outcomes. The plugin ships with a compute domain (411 unique cloud services, verified 2026-03-23). Other domains - education, health, finance, research - can be scaffolded on the fly by the discovery agent when a user brings a goal the existing domains don't cover.

> **Naming note.** This project used to be called Universal Basic Compute (UBC). The name implied a kind of commons, but most free tiers are customer-acquisition spend, not public goods. Bricolage is the more honest name. MCP tool names still carry the `ubc_` prefix for backward compatibility - the prefix is a stable token, not a claim.

---

## Quick Start

**Via the Claude Code plugin marketplace** (recommended):

```
/plugin install chiKeka/bricolage
```

**Manual install:**

```bash
git clone https://github.com/chiKeka/bricolage.git
cd bricolage
npm install
claude --plugin-dir .
```

Then type:

```
/setup
```

The master agent takes over from there.

---

## What's Inside

### 6 Agents

| Agent | What it does |
|---|---|
| **master** | Your entry point. Takes the user's goal, figures out which domain it belongs to, delegates to the right specialist. |
| **planner** | Reads a domain's catalog and picks the minimal set of resources to achieve the goal. Outputs a structured plan. |
| **guide** | Walks users through acquiring access one step at a time. Creating accounts, getting API keys, enrolling in programmes, storing tokens. |
| **assembler** | Takes the plan plus acquired access and builds the outcome. For compute: scaffolds the project, wires the services, deploys. |
| **discovery** | Researches new domains and resources. When a goal doesn't fit any existing domain, discovery scaffolds one, populates its catalog, and creates starter patterns. |
| **infra** | Helps deploy the plugin's own agent runtime (OpenClaw, MiniClaw, PicoClaw) onto user-provisioned free compute. Compute-domain only. |

### 411 Free Resources (compute domain)

Two-tier catalog:

- **10 detailed guides** with full signup instructions, credential capture walkthroughs, and validation regex. GitHub, Vercel, Supabase, OpenAI, Cloudflare, Netlify, Render, Neon, Resend, Upstash.
- **408 bulk entries** in `domains/compute/resources/catalog.yaml` covering AI, cloud infra, storage, automation, APIs, and developer tools. (7 of these share a name with a detailed guide; the loader deduplicates so the merged total is 411.)

Every resource is classified by **free-tier durability** so the planner can prefer tiers that will outlast the project:

| Classification | Meaning | Example |
|---|---|---|
| `cross_subsidy` | Subsidised by a paid business elsewhere. Durable. | Cloudflare, GitHub |
| `public_good` | Funded by a non-commercial institution. Gated but durable. | GitHub Education, .edu datasets |
| `cac_funded` | Customer acquisition. Decays when unit economics change. | Most SaaS free tiers |
| `community` | Volunteer or donation-funded. Availability tracks donations. | Many OSS hosting projects |
| `trial` | Time-limited. Flag, don't rely. | OpenAI's $5 starter credit |
| `unknown` | Not yet classified. Treat as `cac_funded`. | Most bulk-catalog entries |

Every resource also carries a `verified_at` date. Resources aged past **90 days** get a `warn` tag; past **180 days**, `stale`. Pattern planning can exclude stale entries with `exclude_stale=true`. Free tiers are decaying assets - Heroku-in-2022 is the canonical case - so the catalog treats them that way.

The compute catalog was last verified 2026-03-23.

### 5 Assembly Patterns (compute domain)

A pattern is a known-good combination of resources that produces an outcome. Previously called "recipes."

| Pattern | Resources Used | What You Get |
|---|---|---|
| **blog-ai** | GitHub + Vercel + Supabase + OpenAI | Next.js blog with AI summarisation and smart search |
| **portfolio** | GitHub + Vercel + Supabase | Personal site with contact form and analytics |
| **saas-starter** | GitHub + Vercel + Supabase + Cloudflare | Full-stack app with auth, database, CDN |
| **ai-chatbot** | GitHub + Vercel + Supabase + OpenAI | GPT chat with conversation memory |
| **api-backend** | GitHub + Supabase + Cloudflare | REST API on Cloudflare Workers with Postgres |

### 10 MCP Tools

| Tool | Description |
|---|---|
| `ubc_domains` | List all registered domains with trust level |
| `ubc_create_domain` | Scaffold a new domain (defaults to `trust_level: user_scaffolded`) |
| `ubc_catalog` | Browse resources by domain, category, or search. Returns staleness tag on every entry. |
| `ubc_resource_guide` | Full setup guide for one resource |
| `ubc_patterns` | List all assembly patterns for a domain |
| `ubc_pattern_detail` | Full details for one pattern |
| `ubc_status` | Check what's acquired, what's pending, which pattern is active |
| `ubc_update_status` | Update a resource's provisioning status |
| `ubc_store_access` | Store an access token. Validation regex enforced before encryption. |
| `ubc_get_access` | Retrieve stored tokens. Values masked unless `reveal=true`. Every reveal is audited. |

Six legacy aliases (`ubc_service_guide`, `ubc_recipes`, `ubc_recipe_detail`, `ubc_store_credential`, `ubc_get_credentials`) still work for backward compatibility but log a deprecation note in their description.

### 4 Slash Commands

| Command | What it does |
|---|---|
| `/setup` | Interactive onboarding. Checks state, asks about your goal, walks you through everything. |
| `/explore` | Browse the resource catalog. |
| `/build` | Assemble the outcome from acquired resources. |
| `/status` | See what's configured and what's missing. |

---

## Protocol

The protocol has three schema files in `/protocol/`:

- `domain.schema.yaml` - how to register a new domain
- `resource.schema.yaml` - what a resource looks like
- `pattern.schema.yaml` - what an assembly pattern looks like

Executable counterparts live in `tools/src/schemas.ts` (Zod). Every domain, resource, and pattern is validated at load time. Malformed content is rejected with a structured error on stderr rather than silently accepted. This is what keeps the protocol load-bearing instead of decorative.

### Trust Level

Every domain declares a `trust_level`:

- `blessed` - ships with the plugin; reviewed by maintainers
- `user_scaffolded` - created locally by the discovery agent; not reviewed
- `external` - added from an outside source (future: signed registry)

User-scaffolded domains still work, but agents should warn users before treating them as authoritative. This is the minimum governance the protocol needs to avoid becoming a free-for-all.

---

## How It Works

```
You: "I want to build a blog with AI features"

master:
  "Let me plan that out for you."
  → delegates to planner

planner:
  Reads domains/compute/resources/ and patterns/.
  Returns: "Use the blog-ai pattern. GitHub + Vercel + Supabase + OpenAI."

master:
  "Let's set up each service. Starting with GitHub..."
  → delegates to guide

guide:
  "Do you have a GitHub account?"
  "No? No problem. Go to github.com/signup..."
  "Now let's get your API token..."
  Walks through each resource one at a time. Stores each token.

master:
  "All resources are ready. Let me build your blog."
  → delegates to assembler

assembler:
  Scaffolds the project, wires the services, deploys.
  "Your blog is live at https://your-blog.vercel.app"
```

---

## Works With Other Agents Too

The MCP server is platform-agnostic. Connect it to OpenClaw, Cursor, Codex, or any MCP client:

```json
{
  "mcpServers": {
    "bricolage": {
      "command": "npx",
      "args": ["tsx", "tools/src/index.ts"],
      "cwd": "/path/to/bricolage"
    }
  }
}
```

---

## Extending

**Add a resource** - Create a YAML in `domains/compute/resources/` (detailed) or append to `domains/compute/resources/catalog.yaml` (bulk). Include `free_tier_type` and `verified_at`.

**Add a pattern** - Create a YAML in `domains/compute/patterns/` following `protocol/pattern.schema.yaml`.

**Add a domain** - Tell the master agent what you want to accomplish. If no existing domain fits, the discovery agent will scaffold one for you. Or call `ubc_create_domain` directly.

**Add an agent** - Create a `.md` file in `agents/` with frontmatter (name, description, model, tools).

**Update the catalog** - Tell the discovery agent: *"Search for new free-tier AI services and update the catalog."*

---

## Plugin Structure

```
.claude-plugin/plugin.json      Plugin manifest
commands/                       4 slash commands
agents/                         6 agent definitions
protocol/                       3 schema reference files
domains/compute/                compute domain (411 resources, 5 patterns)
domains/<other>/                additional domains scaffolded on the fly
tools/                          MCP server (Zod validation, audit log, AES-256-GCM encryption)
skills/                         OpenClaw integration
CLAUDE.md                       Context for Claude
SECURITY.md                     Trust model, custody, audit log
```

---

## Security

Tokens are encrypted with AES-256-GCM using a machine-local key in `.ubc/.key` (mode 0600).

**Important**: encryption defends against offline file-copy. It does **not** defend against an agent that is already running with this MCP server. Any such agent can call `ubc_get_access` with `reveal=true` and see every token in plaintext. That is inherent to MCP. Reveal events are logged to `.ubc/audit.log` so you can see what looked at what. See `SECURITY.md` for the full threat model.

---

## Contributing

Pull requests welcome. Good places to start:

1. **Add resources** - Find a free tier we're missing? Add it to `domains/compute/resources/catalog.yaml` with `free_tier_type` and `verified_at`.
2. **Add detailed guides** - Write a step-by-step YAML for a resource in `domains/compute/resources/`.
3. **Add patterns** - Create a new assembly blueprint in `domains/compute/patterns/`.
4. **Classify durability** - Help backfill `free_tier_type` across the 408 bulk entries (currently most are `unknown`).
5. **Refresh verifications** - Walk through a resource, confirm the free tier still matches our entry, bump `verified_at`.

---

## License

MIT

---

*Free compute is everywhere. It just needs to be assembled.*
