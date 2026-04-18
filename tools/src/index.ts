#!/usr/bin/env node
/**
 * Bricolage MCP Tools Server — Domain-Agnostic Protocol
 *
 * Exposes Bricolage capabilities to any agent platform via MCP.
 * All tools accept an optional `domain` parameter (defaults to "compute").
 *
 * Run with: npx tsx tools/src/index.ts
 *
 * Tool names keep the `ubc_` prefix from when this plugin was called
 * Universal Basic Compute. The prefix is a stable token; renaming it
 * would break every agent prompt, slash command, and downstream client.
 *
 * Trust model: see SECURITY.md in the repo root. In short — this server
 * hands plaintext tokens to any agent connected to its stdio transport
 * when the agent requests reveal=true. That is inherent to MCP. Audit
 * log at .ubc/audit.log records every such reveal.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  loadAllResources,
  loadResource,
  searchResources,
  getCategoryCounts,
  getStalenessCounts,
  findCredentialValidator,
} from "./catalog.js";
import { loadAllPatterns, loadPattern } from "./patterns.js";
import { getState, updateResourceStatus } from "./state.js";
import { storeAccess, getAccess, recordAudit, ValidationError } from "./access.js";
import { listDomains, scaffoldDomain, validateDomain } from "./domains.js";

const server = new McpServer({
  name: "bricolage-tools",
  version: "0.4.0",
});

// ── Domain Tools ──────────────────────────────────────

server.tool(
  "ubc_domains",
  "List all available Bricolage domains. Each domain is a category of free resources (compute, education, etc.). Domains include a trust_level — 'blessed' for domains shipped with the plugin, 'user_scaffolded' for domains created locally by the discovery agent.",
  {},
  async () => {
    const domains = listDomains();
    return { content: [{ type: "text", text: JSON.stringify(domains, null, 2) }] };
  }
);

server.tool(
  "ubc_create_domain",
  "Scaffold a new domain. Creates the directory structure and domain.yaml so the discovery agent can populate it with resources and patterns. New domains are marked trust_level=user_scaffolded by default; a human reviewer has to promote them to blessed.",
  {
    id: z.string().describe("Domain slug (e.g., 'education', 'health', 'finance')"),
    name: z.string().describe("Human-readable name"),
    description: z.string().describe("What this domain covers"),
    categories: z.array(z.string()).optional().describe("Resource categories within this domain"),
    resource_types: z.array(z.string()).optional().describe("Kinds of resources (course, service, tool, etc.)"),
    access_types: z.array(z.string()).optional().describe("How access is granted (api_key, enrollment, open, etc.)"),
    assembly_verbs: z.array(z.string()).optional().describe("Actions agents perform (provision, enroll, build, etc.)"),
    outcome_types: z.array(z.string()).optional().describe("What gets produced (deployed_app, learning_path, etc.)"),
  },
  async ({ id, name, description, categories, resource_types, access_types, assembly_verbs, outcome_types }) => {
    if (validateDomain(id)) {
      return { content: [{ type: "text", text: `Domain "${id}" already exists.` }], isError: true };
    }
    try {
      const domain = scaffoldDomain(
        id, name, description, categories, resource_types, access_types, assembly_verbs, outcome_types
      );
      recordAudit({ action: "create_domain", domain: id });
      return {
        content: [
          {
            type: "text",
            text:
              `Created domain "${id}" (trust_level: user_scaffolded):\n${JSON.stringify(domain, null, 2)}\n\n` +
              `Directories created:\n  domains/${id}/resources/\n  domains/${id}/patterns/\n\n` +
              `The discovery agent can now populate this domain with resources and patterns.\n` +
              `Note: user_scaffolded domains have not been reviewed. Agents should warn users before treating their content as authoritative.`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Failed to scaffold domain: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      };
    }
  }
);

// ── Catalog Tools ──────────────────────────────────────

server.tool(
  "ubc_catalog",
  "Browse the Bricolage resource catalog. Filter by category or search by name/description. Defaults to the 'compute' domain. Each entry is tagged with a staleness level (fresh, warn, stale, unknown) based on its verified_at date.",
  {
    domain: z.string().default("compute").describe("Domain to browse (e.g., 'compute', 'education')"),
    category: z.string().optional().describe("Filter by category"),
    search: z.string().optional().describe("Search by name, provider, or description"),
    limit: z.number().optional().default(50).describe("Max results to return (default 50)"),
    exclude_stale: z.boolean().optional().default(false).describe("Exclude resources whose verification is older than 180 days"),
  },
  async ({ domain, category, search, limit, exclude_stale }) => {
    if (!validateDomain(domain)) {
      return { content: [{ type: "text", text: `Domain "${domain}" not found. Use ubc_domains to list available domains.` }], isError: true };
    }

    if (search) {
      const results = searchResources(domain, search, category, { excludeStale: exclude_stale }).slice(0, limit);
      return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
    }

    if (category) {
      const results = loadAllResources(domain, { excludeStale: exclude_stale })
        .filter((s) => s.category === category)
        .slice(0, limit);
      return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
    }

    const counts = getCategoryCounts(domain, { excludeStale: exclude_stale });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const staleness = getStalenessCounts(domain);
    // Honour exclude_stale for the detailed_guides list too — otherwise
    // total_resources and detailed_guides can disagree when a detailed
    // guide has gone stale.
    const detailed_guides = loadAllResources(domain, { excludeStale: exclude_stale })
      .filter((s) => s.has_detailed_guide)
      .map((s) => s.name);
    const summary = {
      domain,
      total_resources: total,
      categories: counts,
      staleness,
      detailed_guides,
      hint:
        "Use 'category' to browse a category, 'search' to find specific resources, " +
        "or exclude_stale=true to filter out resources whose free-tier claim hasn't been verified recently.",
    };
    return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
  }
);

server.tool(
  "ubc_resource_guide",
  "Get the full setup guide for a resource — access steps, how to get credentials/tokens, free-tier limits. Includes verified_at so you can see how fresh the guide is.",
  {
    domain: z.string().default("compute").describe("Domain"),
    resource: z.string().describe("Resource name"),
  },
  async ({ domain, resource }) => {
    if (!validateDomain(domain)) {
      return { content: [{ type: "text", text: `Domain "${domain}" not found.` }], isError: true };
    }
    const res = loadResource(domain, resource);
    if (!res) {
      return { content: [{ type: "text", text: `Resource "${resource}" not found in domain "${domain}".` }], isError: true };
    }
    return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
  }
);

// ── Pattern Tools ──────────────────────────────────────

server.tool(
  "ubc_patterns",
  "List all assembly patterns for a domain. Patterns are known-good combinations of resources that produce outcomes.",
  {
    domain: z.string().default("compute").describe("Domain"),
  },
  async ({ domain }) => {
    if (!validateDomain(domain)) {
      return { content: [{ type: "text", text: `Domain "${domain}" not found.` }], isError: true };
    }
    const patterns = loadAllPatterns(domain);
    const summary = patterns.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      resources: (r.resources ?? []).map((s) => s.resource),
    }));
    return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
  }
);

server.tool(
  "ubc_pattern_detail",
  "Get full details for a specific pattern including what it builds and estimated effort.",
  {
    domain: z.string().default("compute").describe("Domain"),
    pattern_id: z.string().describe("Pattern ID"),
  },
  async ({ domain, pattern_id }) => {
    if (!validateDomain(domain)) {
      return { content: [{ type: "text", text: `Domain "${domain}" not found.` }], isError: true };
    }
    const pattern = loadPattern(domain, pattern_id);
    if (!pattern) {
      return { content: [{ type: "text", text: `Pattern "${pattern_id}" not found in domain "${domain}".` }], isError: true };
    }
    return { content: [{ type: "text", text: JSON.stringify(pattern, null, 2) }] };
  }
);

// ── Status Tools ──────────────────────────────────────

server.tool(
  "ubc_status",
  "Check current setup state — which resources are provisioned, what access tokens exist, active pattern.",
  {
    domain: z.string().optional().describe("Filter by domain (omit for all domains)"),
  },
  async ({ domain }) => {
    const state = getState();
    if (domain) {
      const ds = state.domains[domain];
      if (!ds) {
        return { content: [{ type: "text", text: JSON.stringify({ domain, resources: {}, active_pattern: null }, null, 2) }] };
      }
      return { content: [{ type: "text", text: JSON.stringify({ domain, ...ds, project_status: state.project_status }, null, 2) }] };
    }
    return { content: [{ type: "text", text: JSON.stringify(state, null, 2) }] };
  }
);

server.tool(
  "ubc_update_status",
  "Update the provisioning status of a resource.",
  {
    domain: z.string().default("compute").describe("Domain"),
    resource: z.string().describe("Resource name"),
    status: z.enum(["not_started", "in_progress", "ready", "failed"]),
  },
  async ({ domain, resource, status }) => {
    updateResourceStatus(domain, resource, status);
    return { content: [{ type: "text", text: `Updated ${resource} status to: ${status} (domain: ${domain})` }] };
  }
);

// ── Access Tools ──────────────────────────────────────

server.tool(
  "ubc_store_access",
  "Store an access token the user has provided (API key, enrollment ID, account credential, etc.). If the resource's catalog entry declares a validation regex, the value is checked against it before being encrypted — this catches paste-into-wrong-field mistakes.",
  {
    domain: z.string().default("compute").describe("Domain"),
    resource: z.string().describe("Resource name"),
    name: z.string().describe("Token name, e.g. GITHUB_TOKEN"),
    value: z.string().describe("The token value"),
    type: z.enum(["api_key", "api_token", "connection_string", "account_id", "enrollment", "certificate", "other"]).default("api_key"),
  },
  async ({ domain, resource, name, value, type }) => {
    const validator = findCredentialValidator(domain, resource, name);
    try {
      storeAccess(domain, resource, name, value, type, validator ?? undefined);
    } catch (err) {
      if (err instanceof ValidationError) {
        recordAudit({ action: "store_access_rejected", domain, resource, detail: name });
        return {
          content: [{ type: "text", text: err.message }],
          isError: true,
        };
      }
      throw err;
    }
    updateResourceStatus(domain, resource, "ready");
    recordAudit({ action: "store_access", domain, resource, detail: name });
    return { content: [{ type: "text", text: `Stored ${name} for ${resource} (domain: ${domain}).` }] };
  }
);

server.tool(
  "ubc_get_access",
  "Get all stored access tokens, optionally filtered by domain and resource. Values are masked unless reveal=true. Every reveal=true call is written to .ubc/audit.log.",
  {
    domain: z.string().default("compute").describe("Domain"),
    resource: z.string().optional().describe("Filter by resource name"),
    reveal: z.boolean().default(false).describe("Show actual values (use with care — every reveal is audited)"),
  },
  async ({ domain, resource, reveal }) => {
    const tokens = getAccess(domain, resource);
    if (reveal) {
      recordAudit({ action: "reveal_access", domain, resource, count: tokens.length });
    }
    const result = tokens.map((c) => ({
      domain,
      resource: c.service,
      name: c.name,
      type: c.type,
      value: reveal
        ? c.value
        : c.value.length >= 16
          ? c.value.slice(0, 4) + "****" + c.value.slice(-4)
          : "****",
    }));
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// ── Legacy Aliases (backward compatibility) ───────────

server.tool(
  "ubc_service_guide",
  "DEPRECATED: Use ubc_resource_guide. Get the full setup guide for a service.",
  { service: z.string().describe("Service name") },
  async ({ service }) => {
    const svc = loadResource("compute", service);
    if (!svc) {
      return { content: [{ type: "text", text: `Service "${service}" not found.` }], isError: true };
    }
    return { content: [{ type: "text", text: JSON.stringify(svc, null, 2) }] };
  }
);

server.tool(
  "ubc_recipes",
  "DEPRECATED: Use ubc_patterns. List all project recipes.",
  {},
  async () => {
    const patterns = loadAllPatterns("compute");
    const summary = patterns.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      services: (r.resources ?? r.services ?? []).map((s: { resource?: string; service?: string }) => s.resource ?? s.service),
    }));
    return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
  }
);

server.tool(
  "ubc_recipe_detail",
  "DEPRECATED: Use ubc_pattern_detail. Get full details for a recipe.",
  { recipe_id: z.string().describe("Recipe ID") },
  async ({ recipe_id }) => {
    const pattern = loadPattern("compute", recipe_id);
    if (!pattern) {
      return { content: [{ type: "text", text: `Recipe "${recipe_id}" not found.` }], isError: true };
    }
    return { content: [{ type: "text", text: JSON.stringify(pattern, null, 2) }] };
  }
);

server.tool(
  "ubc_store_credential",
  "DEPRECATED: Use ubc_store_access. Store a credential.",
  {
    service: z.string(), name: z.string(), value: z.string(),
    type: z.enum(["api_key", "api_token", "connection_string", "account_id", "other"]).default("api_key"),
  },
  async ({ service, name, value, type }) => {
    const validator = findCredentialValidator("compute", service, name);
    try {
      storeAccess("compute", service, name, value, type, validator ?? undefined);
    } catch (err) {
      if (err instanceof ValidationError) {
        recordAudit({ action: "store_access_rejected", domain: "compute", resource: service, detail: name });
        return { content: [{ type: "text", text: err.message }], isError: true };
      }
      throw err;
    }
    updateResourceStatus("compute", service, "ready");
    recordAudit({ action: "store_access", domain: "compute", resource: service, detail: name });
    return { content: [{ type: "text", text: `Stored ${name} for ${service}.` }] };
  }
);

server.tool(
  "ubc_get_credentials",
  "DEPRECATED: Use ubc_get_access. Get stored credentials.",
  {
    service: z.string().optional(),
    reveal: z.boolean().default(false),
  },
  async ({ service, reveal }) => {
    const tokens = getAccess("compute", service);
    if (reveal) {
      recordAudit({ action: "reveal_access", domain: "compute", resource: service, count: tokens.length });
    }
    const result = tokens.map((c) => ({
      service: c.service,
      name: c.name,
      type: c.type,
      value: reveal
        ? c.value
        : c.value.length >= 16
          ? c.value.slice(0, 4) + "****" + c.value.slice(-4)
          : "****",
    }));
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// ── Resources ──────────────────────────────────────────

server.resource(
  "ubc://domains",
  "ubc://domains",
  async () => {
    const domains = listDomains();
    return { contents: [{ uri: "ubc://domains", text: JSON.stringify(domains, null, 2), mimeType: "application/json" }] };
  }
);

server.resource(
  "ubc://status",
  "ubc://status",
  async () => {
    const state = getState();
    return { contents: [{ uri: "ubc://status", text: JSON.stringify(state, null, 2), mimeType: "application/json" }] };
  }
);

// ── Start ──────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP server error:", err);
  process.exit(1);
});
