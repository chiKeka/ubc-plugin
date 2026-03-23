/**
 * Service catalog types — ported from v1, extended for v2
 */

export type ComputeCategory =
  | "ai_llm"
  | "cloud_infrastructure"
  | "automation_workflow"
  | "data_storage"
  | "api_services";

export type UseCaseCategory =
  | "education"
  | "productivity"
  | "civic_tools"
  | "creative"
  | "developer_tools";

export type ComputeUnitType =
  | "tokens"
  | "api_calls"
  | "compute_minutes"
  | "storage_gb"
  | "tasks"
  | "requests";

export interface ComputeSource {
  id: string;
  name: string;
  provider: string;
  description: string | null;
  category: ComputeCategory;
  logo_url: string | null;
  website_url: string | null;
  pricing_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FreeTierLimit {
  id: string;
  source_id: string;
  limit_name: string;
  limit_value: number;
  limit_unit: string;
  period: string;
  notes: string | null;
}

export interface NormalizedMetric {
  id: string;
  source_id: string;
  unit_type: ComputeUnitType;
  daily_value: number | null;
  weekly_value: number | null;
  monthly_value: number | null;
  notes: string | null;
}

export interface AggregateTotals {
  id: string;
  category: ComputeCategory | null;
  unit_type: ComputeUnitType;
  daily_total: number;
  weekly_total: number;
  monthly_total: number;
  source_count: number;
  calculated_at: string;
}

export interface HistoricalSnapshot {
  id: string;
  source_id: string;
  snapshot_date: string;
  total_normalized_value: number;
  raw_data: Record<string, unknown> | null;
}
