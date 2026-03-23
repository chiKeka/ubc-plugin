/**
 * Custom MCP server providing UBCI-specific tools to the agents.
 * Tools: catalog query, credential store/retrieve, progress emission.
 */

import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

// Placeholder catalog data (will be replaced with Supabase queries in Phase 2)
const CATALOG = [
  {
    name: "GitHub",
    provider: "GitHub",
    category: "cloud_infrastructure",
    pricing_url: "https://github.com/pricing",
    description: "Code hosting, CI/CD with Actions (2000 min/mo free), Packages (500MB), Codespaces (120 core-hrs/mo)",
    free_tier: [
      { limit: "Actions Minutes", value: 2000, unit: "minutes/month", notes: "Public repos; 500 for private" },
      { limit: "Packages Storage", value: 500, unit: "MB/month" },
      { limit: "Codespaces", value: 120, unit: "core-hours/month" },
    ],
  },
  {
    name: "Vercel",
    provider: "Vercel",
    category: "cloud_infrastructure",
    pricing_url: "https://vercel.com/pricing",
    description: "Frontend hosting, serverless functions (100 GB-hrs/mo), 6000 build min/mo, 100GB bandwidth",
    free_tier: [
      { limit: "Bandwidth", value: 100, unit: "GB/month" },
      { limit: "Serverless Execution", value: 100, unit: "GB-hours/month" },
      { limit: "Build Minutes", value: 6000, unit: "minutes/month" },
    ],
  },
  {
    name: "Supabase",
    provider: "Supabase",
    category: "cloud_infrastructure",
    pricing_url: "https://supabase.com/pricing",
    description: "Postgres (500MB), Auth (50k MAU), Edge Functions (500k invocations/mo), Storage (1GB)",
    free_tier: [
      { limit: "Database", value: 500, unit: "MB" },
      { limit: "Storage", value: 1, unit: "GB" },
      { limit: "Edge Function Invocations", value: 500000, unit: "/month" },
      { limit: "Auth MAUs", value: 50000, unit: "/month" },
    ],
  },
  {
    name: "OpenAI API",
    provider: "OpenAI",
    category: "ai_llm",
    pricing_url: "https://openai.com/api/pricing/",
    description: "GPT models, embeddings, DALL-E, Whisper. $5 free trial credits for new accounts",
    free_tier: [
      { limit: "Free Credits", value: 5, unit: "USD", notes: "One-time trial" },
      { limit: "Rate Limit (GPT-3.5)", value: 500, unit: "requests/minute" },
    ],
  },
  {
    name: "Cloudflare",
    provider: "Cloudflare",
    category: "cloud_infrastructure",
    pricing_url: "https://www.cloudflare.com/plans/",
    description: "CDN, Workers (100k req/day), Pages, R2 (10GB), D1 (5GB SQLite-at-edge)",
    free_tier: [
      { limit: "Workers Requests", value: 100000, unit: "/day" },
      { limit: "Pages Builds", value: 500, unit: "/month" },
      { limit: "R2 Storage", value: 10, unit: "GB/month" },
      { limit: "D1 Database", value: 5, unit: "GB" },
    ],
  },
];

// In-memory credential store (will be replaced with encrypted Supabase storage in Phase 2)
const credentialStore = new Map<string, { name: string; type: string; value: string; service: string }>();

export function createUbciMcpServer() {
  return createSdkMcpServer({
    name: "ubci",
    version: "0.1.0",
    tools: [
      tool(
        "ubci_query_catalog",
        "Query the UBCI service catalog. Returns services matching the filter criteria.",
        { category: z.string().optional().describe("Filter by category: ai_llm, cloud_infrastructure, automation_workflow, data_storage, api_services"), name: z.string().optional().describe("Search by service name (partial match)") },
        async (args) => {
          let results = CATALOG;
          if (args.category) {
            results = results.filter((s) => s.category === args.category);
          }
          if (args.name) {
            const search = args.name.toLowerCase();
            results = results.filter(
              (s) => s.name.toLowerCase().includes(search) || s.provider.toLowerCase().includes(search)
            );
          }
          return {
            content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }],
          };
        }
      ),

      tool(
        "ubci_get_service_limits",
        "Get detailed free-tier limits for a specific service.",
        { service_name: z.string().describe("Service name (e.g., 'GitHub', 'Vercel')") },
        async (args) => {
          const service = CATALOG.find(
            (s) => s.name.toLowerCase() === args.service_name.toLowerCase()
          );
          if (!service) {
            return {
              content: [{ type: "text" as const, text: `Service "${args.service_name}" not found in catalog.` }],
              isError: true,
            };
          }
          return {
            content: [{ type: "text" as const, text: JSON.stringify(service, null, 2) }],
          };
        }
      ),

      tool(
        "ubci_store_credential",
        "Store a captured credential securely. Use this whenever you capture an API key, token, or connection string.",
        {
          service_name: z.string().describe("Service name (e.g., 'GitHub', 'Vercel')"),
          credential_name: z.string().describe("Credential name (e.g., 'GITHUB_TOKEN', 'VERCEL_TOKEN')"),
          credential_type: z.enum(["api_key", "oauth_token", "connection_string", "password", "other"]),
          value: z.string().describe("The credential value to store"),
        },
        async (args) => {
          // Phase 1: In-memory store. Phase 2: Encrypted Supabase storage.
          credentialStore.set(args.credential_name, {
            name: args.credential_name,
            type: args.credential_type,
            value: args.value,
            service: args.service_name,
          });
          console.log(`  [credential captured] ${args.credential_name} for ${args.service_name}`);
          return {
            content: [{
              type: "text" as const,
              text: `Credential "${args.credential_name}" stored successfully for ${args.service_name}.`,
            }],
          };
        }
      ),

      tool(
        "ubci_get_credential",
        "Retrieve a stored credential by name.",
        { credential_name: z.string().describe("Credential name to retrieve") },
        async (args) => {
          const cred = credentialStore.get(args.credential_name);
          if (!cred) {
            return {
              content: [{ type: "text" as const, text: `Credential "${args.credential_name}" not found.` }],
              isError: true,
            };
          }
          return {
            content: [{ type: "text" as const, text: JSON.stringify(cred, null, 2) }],
          };
        }
      ),

      tool(
        "ubci_load_template",
        "Load a service signup template by service name.",
        { service_name: z.string().describe("Service name (e.g., 'github', 'vercel')") },
        async (args) => {
          // Templates loaded from filesystem — dynamic import
          try {
            const { loadTemplate } = await import("../templates/loader.js");
            const template = loadTemplate(args.service_name);
            if (!template) {
              return {
                content: [{ type: "text" as const, text: `No template found for "${args.service_name}".` }],
              };
            }
            return {
              content: [{ type: "text" as const, text: JSON.stringify(template, null, 2) }],
            };
          } catch {
            return {
              content: [{ type: "text" as const, text: `Failed to load template for "${args.service_name}".` }],
              isError: true,
            };
          }
        }
      ),

      tool(
        "ubci_emit_progress",
        "Emit a progress event for the current agent run. Shows up in the web dashboard.",
        {
          event_type: z.enum(["step_started", "step_completed", "step_failed", "credential_captured", "user_action_required", "info"]),
          service_name: z.string().optional(),
          message: z.string().describe("Human-readable progress message"),
        },
        async (args) => {
          // Phase 1: Console output. Phase 2: Supabase Realtime.
          const prefix = args.event_type === "step_failed" ? "FAIL" :
                         args.event_type === "user_action_required" ? "ACTION NEEDED" :
                         args.event_type === "credential_captured" ? "CAPTURED" :
                         args.event_type;
          const service = args.service_name ? `[${args.service_name}] ` : "";
          console.log(`  [${prefix}] ${service}${args.message}`);
          return {
            content: [{ type: "text" as const, text: "Progress event emitted." }],
          };
        }
      ),
    ],
  });
}
