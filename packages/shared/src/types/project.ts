/**
 * Project types — a user's assembled compute project
 */

export type ProjectStatus =
  | "planning"
  | "provisioning"
  | "assembling"
  | "ready"
  | "failed";

export type ServiceRole =
  | "hosting"
  | "database"
  | "ai_api"
  | "auth"
  | "storage"
  | "cdn"
  | "email"
  | "cache"
  | "ci_cd"
  | "monitoring"
  | "other";

export type ProjectServiceStatus =
  | "pending"
  | "signing_up"
  | "provisioned"
  | "configured"
  | "failed";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  plan: TaskPlan | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectService {
  id: string;
  project_id: string;
  source_id: string;
  role: ServiceRole;
  status: ProjectServiceStatus;
  provision_metadata: Record<string, unknown> | null;
  created_at: string;
}

/** The structured plan output from the Planner agent */
export interface TaskPlan {
  goal: string;
  services: PlannedService[];
  estimated_budget: ResourceBudget;
  gaps: GapAnalysis[];
  confidence: number;
  reasoning: string;
}

export interface PlannedService {
  source_id: string;
  source_name: string;
  role: ServiceRole;
  reason: string;
  estimated_usage: {
    daily: Record<string, number>;
    monthly: Record<string, number>;
  };
}

export interface ResourceBudget {
  tokens_monthly: number;
  api_calls_monthly: number;
  storage_gb: number;
  compute_minutes_monthly: number;
}

export interface GapAnalysis {
  requirement: string;
  gap_description: string;
  severity: "low" | "medium" | "high";
  suggested_paid_alternative: string | null;
}
