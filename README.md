# Universal Basic Compute

A Claude Code plugin that provisions and assembles free-tier cloud services into working projects.

Install the plugin. Type `/setup`. The agents handle the rest.

## Install

```bash
# Clone and install
git clone https://github.com/chiKeka/universalbasiccompute-v2.git
cd universalbasiccompute-v2
npm install

# Load as a Claude Code plugin
claude --plugin-dir .
```

Or install from a marketplace (coming soon):
```
/plugin install universal-basic-compute
```

## What You Get

**6 Agents** that work together:

| Agent | What it does |
|-------|-------------|
| Master | Orchestrates everything — your entry point |
| Planner | Picks the right free services for your project |
| Provisioner | Walks you through creating accounts step by step |
| Assembler | Builds and deploys your project |
| Catalog | Keeps the free-tier service list up to date |
| Infra | Helps set up agent infrastructure (OpenClaw, etc.) |

**418 Free-Tier Services** in the catalog, including:
- GitHub, Vercel, Supabase, OpenAI, Cloudflare
- Netlify, Render, Neon, Resend, Upstash
- 400+ more across AI, cloud, database, automation, APIs, and dev tools

**5 Project Recipes**:
- Blog with AI summarization
- Portfolio site
- SaaS starter
- AI chatbot
- REST API backend

**8 MCP Tools** (auto-registered):
- `ubc_catalog` — Browse 418 free services
- `ubc_service_guide` — Step-by-step signup instructions
- `ubc_recipes` / `ubc_recipe_detail` — Project blueprints
- `ubc_status` — What's provisioned so far
- `ubc_store_credential` / `ubc_get_credentials` — Credential management
- `ubc_update_status` — Track provisioning progress

## Commands

| Command | What it does |
|---------|-------------|
| `/setup` | Interactive onboarding — walks you through everything |
| `/provision` | Set up a specific service (e.g., `/provision github`) |
| `/build` | Assemble and deploy your project |
| `/catalog` | Browse available free-tier services |
| `/status` | Check what's configured and what's missing |

## How It Works

1. Type `/setup` or tell Claude what you want to build
2. The **planner** picks the right free-tier services
3. The **provisioner** walks you through creating accounts (step by step, in plain English)
4. You paste your API keys — they're stored locally
5. The **assembler** wires everything together and deploys
6. You get a working project on free infrastructure

## Also Works With Other Agents

The MCP server works with any MCP-compatible agent (OpenClaw, Cursor, Codex):

```json
{
  "mcpServers": {
    "ubc": {
      "command": "npx",
      "args": ["tsx", "tools/src/index.ts"],
      "cwd": "/path/to/universalbasiccompute-v2"
    }
  }
}
```

## Plugin Structure

```
.claude-plugin/     Plugin manifest
commands/           Slash commands (/setup, /provision, /build, etc.)
agents/             6 agent definitions (Markdown)
services/           418 service catalog + 10 detailed signup guides
recipes/            5 project blueprints
tools/              MCP server (auto-registered)
skills/             OpenClaw integration
```

## Extending

**Add a service**: Create a YAML in `services/` or add to `services/catalog.yaml`

**Add a recipe**: Create a YAML in `recipes/`

**Add an agent**: Create a `.md` file in `agents/` with frontmatter

## The Idea

Free-tier services from hundreds of providers collectively form meaningful compute — enough to build real applications without paying for infrastructure. We call this **Universal Basic Compute**.

This plugin makes that compute accessible to everyone.

## License

MIT
