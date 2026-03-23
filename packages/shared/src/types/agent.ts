/**
 * Agent execution types — tracking runs, events, and progress
 */

export type AgentType =
  | "orchestrator"
  | "planner"
  | "provisioner"
  | "assembler"
  | "catalog";

export type AgentRunStatus =
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type AgentEventType =
  | "step_started"
  | "step_completed"
  | "step_failed"
  | "credential_captured"
  | "user_action_required"
  | "info";

export interface AgentRun {
  id: string;
  project_id: string | null;
  user_id: string;
  agent_type: AgentType;
  status: AgentRunStatus;
  started_at: string;
  completed_at: string | null;
  cost_usd: number | null;
  turns: number | null;
  error: string | null;
}

export interface AgentEvent {
  id: string;
  run_id: string;
  project_id: string | null;
  event_type: AgentEventType;
  service_name: string | null;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/** A single step in a provisioning flow */
export interface ProvisionStep {
  service_name: string;
  step_name: string;
  action: "goto" | "click" | "fill" | "capture" | "wait" | "verify";
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  detail: string | null;
}

/** Change detected during catalog update */
export interface CatalogChange {
  source_name: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  change_type: "limit_increased" | "limit_decreased" | "new_feature" | "deprecated" | "new_service" | "no_change";
  detected_at: string;
}
