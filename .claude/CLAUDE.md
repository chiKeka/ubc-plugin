# UBC v2 — Universal Basic Compute

Agentic platform that provisions and assembles free-tier cloud/AI services on behalf of users.

## Architecture
- **Monorepo**: pnpm workspaces + Turborepo
- **packages/shared**: Shared types, constants, crypto utilities
- **packages/supabase**: Database migrations, edge functions, seed data
- **apps/cli**: CLI agent (primary interface) — Claude Agent SDK + Playwright MCP
- **apps/web**: Web dashboard (Next.js) — Phase 3
- **templates/**: YAML service signup flow templates

## Tech Stack
- TypeScript throughout, ES2022 target, Node16 module resolution
- Claude Agent SDK for agent orchestration
- Playwright MCP for browser automation
- Supabase (Postgres + Auth + Realtime) for database
- Commander for CLI, Zod for validation, YAML for templates

## Key Commands
- `pnpm build` — build all packages
- `pnpm --filter @ubcv2/cli build` — build CLI only
- `pnpm --filter @ubcv2/shared build` — build shared package only

## Conventions
- All packages use ESM (`"type": "module"`)
- Shared types imported from `@ubcv2/shared`
- Service templates are YAML files in `/templates`
