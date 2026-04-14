# Universal Basic Compute

> A Claude Code plugin that turns free-tier cloud services into working projects.

Free-tier services from GitHub, Vercel, Supabase, OpenAI, Cloudflare, and hundreds more collectively provide real compute power — enough to build and deploy applications without paying for infrastructure. We call this **Universal Basic Compute**.

This plugin gives you 6 AI agents that know about 418 free services. Tell them what you want to build, and they walk you through provisioning accounts, capturing credentials, and assembling a deployed project — step by step, in plain English.

---

## Quick Start

**Via Claude Code plugin marketplace** (recommended):

```
/plugin install chiKeka/ubc-plugin
```

**Manual install:**

```bash
git clone https://github.com/chiKeka/ubc-plugin.git
cd ubc-plugin
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
|-------|-------------|
| **Master** | Your entry point. Understands your goal and delegates to the right agent. |
| **Planner** | Analyzes what you want to build and picks the best free services. |
| **Provisioner** | Walks you through creating accounts and getting API keys, one step at a time. |
| **Assembler** | Takes your provisioned services and builds + deploys the actual project. |
| **Catalog** | Searches the web for new free-tier services and keeps the catalog current. |
| **Infra** | Helps you set up your own agent infrastructure (OpenClaw, MiniClaw, PicoClaw). |

### 418 Free-Tier Services

The catalog spans 6 categories:

| Category | Services | Examples |
|----------|----------|---------|
| AI & LLMs | 30 | OpenAI, Gemini, Groq, Mistral, Cohere, Replicate |
| Cloud Infrastructure | 46 | Vercel, Cloudflare, Netlify, Render, Fly.io, Deno Deploy |
| Data & Storage | 51 | Supabase, Neon, Upstash, MongoDB Atlas, Firebase, Turso |
| Automation & Workflow | 40 | GitHub Actions, Make, Pipedream, n8n, IFTTT |
| API Services | 132 | Resend, Stripe, Auth0, Clerk, Algolia, Sentry, Cloudinary |
| Developer Tools | 109 | GitHub, GitLab, Codespaces, Sentry, PostHog, Linear |

10 services have **detailed setup guides** with step-by-step signup instructions, credential capture walkthroughs, and validation patterns: GitHub, Vercel, Supabase, OpenAI, Cloudflare, Netlify, Render, Neon, Resend, and Upstash.

### 5 Project Recipes

Pre-built blueprints the agents know how to assemble:

| Recipe | Services Used | What You Get |
|--------|--------------|-------------|
| **Blog with AI** | GitHub + Vercel + Supabase + OpenAI | Next.js blog with AI summarization and smart search |
| **Portfolio** | GitHub + Vercel + Supabase | Personal site with contact form and analytics |
| **SaaS Starter** | GitHub + Vercel + Supabase + Cloudflare | Full-stack app with auth, DB, and CDN |
| **AI Chatbot** | GitHub + Vercel + Supabase + OpenAI | GPT chat with conversation memory |
| **API Backend** | GitHub + Supabase + Cloudflare | REST API on Cloudflare Workers with Postgres |

### 8 MCP Tools (auto-registered)

| Tool | Description |
|------|-------------|
| `ubc_catalog` | Browse and search 418 free services by category or keyword |
| `ubc_service_guide` | Get full setup guide for a service (signup, credentials, limits) |
| `ubc_recipes` | List all project recipes |
| `ubc_recipe_detail` | Get full details for a specific recipe |
| `ubc_status` | Check what's provisioned and what's still needed |
| `ubc_update_status` | Mark a service as provisioned |
| `ubc_store_credential` | Save an API key or token securely |
| `ubc_get_credentials` | Retrieve stored credentials |

### 5 Slash Commands

| Command | What it does |
|---------|-------------|
| `/setup` | Interactive onboarding — checks your state and walks you through everything |
| `/provision` | Provision a specific service (e.g., `/provision github`) |
| `/build` | Assemble and deploy your project from provisioned services |
| `/catalog` | Browse the free-tier service catalog |
| `/status` | See what's configured and what's missing |

---

## How It Works

```
You: "I want to build a blog with AI features"

Master Agent:
  "Great! Let me plan that out for you."
  → delegates to Planner

Planner Agent:
  "You'll need GitHub, Vercel, Supabase, and OpenAI."
  → returns plan to Master

Master Agent:
  "Let's set up each service. Starting with GitHub..."
  → delegates to Provisioner

Provisioner Agent:
  "Do you have a GitHub account?"
  "No? No problem! Go to github.com/signup..."
  "Now let's get your API token..."
  → walks through each service step by step

Master Agent:
  "All services are ready! Let me build your blog."
  → delegates to Assembler

Assembler Agent:
  → creates project, wires services, deploys
  "Your blog is live at https://your-blog.vercel.app!"
```

---

## Works With Other Agents Too

The MCP server is platform-agnostic. Connect it to OpenClaw, Cursor, Codex, or any MCP client:

```json
{
  "mcpServers": {
    "ubc": {
      "command": "npx",
      "args": ["tsx", "tools/src/index.ts"],
      "cwd": "/path/to/ubc-plugin"
    }
  }
}
```

---

## Extending

**Add a service** — Create a YAML in `services/` or add an entry to `services/catalog.yaml`

**Add a recipe** — Create a YAML in `recipes/` listing required services and what to build

**Add an agent** — Create a `.md` file in `agents/` with frontmatter (name, description, model, tools)

**Update the catalog** — Tell the catalog agent: *"Search for new free-tier AI services"*

---

## Plugin Structure

```
.claude-plugin/plugin.json    Plugin manifest
commands/                     5 slash commands
agents/                       6 agent definitions (Markdown)
services/                     10 detailed guides + 408 bulk catalog
recipes/                      5 project blueprints
tools/                        MCP server (auto-registered on install)
skills/                       OpenClaw integration
CLAUDE.md                     Context for Claude
```

---

## Contributing

Pull requests welcome. The easiest ways to contribute:

1. **Add services** — Found a free tier we're missing? Add it to `services/catalog.yaml`
2. **Add detailed guides** — Write a step-by-step YAML for a service in `services/`
3. **Add recipes** — Create a new project blueprint in `recipes/`
4. **Improve agents** — Tune the system prompts in `agents/*.md`

---

## License

MIT

---

*Built on the idea that free compute is everywhere — it just needs to be assembled.*
