import type { ComputeCategory, ComputeUnitType, UseCaseCategory } from "../types/service.js";

export const CATEGORY_LABELS: Record<ComputeCategory, string> = {
  ai_llm: "AI & LLMs",
  cloud_infrastructure: "Cloud Infrastructure",
  automation_workflow: "Automation & Workflow",
  data_storage: "Data & Storage",
  api_services: "API Services",
};

export const UNIT_LABELS: Record<ComputeUnitType, string> = {
  tokens: "Tokens",
  api_calls: "API Calls",
  compute_minutes: "Compute Minutes",
  storage_gb: "Storage (GB)",
  tasks: "Tasks",
  requests: "Requests",
};

export const USE_CASE_LABELS: Record<UseCaseCategory, string> = {
  education: "Education",
  productivity: "Productivity",
  civic_tools: "Civic Tools",
  creative: "Creative",
  developer_tools: "Developer Tools",
};

/** MVP services for Phase 1 */
export const MVP_SERVICES = [
  { name: "GitHub", provider: "GitHub", category: "cloud_infrastructure" as const },
  { name: "Vercel", provider: "Vercel", category: "cloud_infrastructure" as const },
  { name: "Supabase", provider: "Supabase", category: "cloud_infrastructure" as const },
  { name: "OpenAI", provider: "OpenAI", category: "ai_llm" as const },
  { name: "Cloudflare", provider: "Cloudflare", category: "cloud_infrastructure" as const },
] as const;
