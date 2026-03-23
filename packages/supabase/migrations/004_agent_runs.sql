-- Agent execution tracking: runs and granular events

CREATE TYPE agent_type AS ENUM (
  'orchestrator',
  'planner',
  'provisioner',
  'assembler',
  'catalog'
);

CREATE TYPE agent_run_status AS ENUM (
  'running',
  'completed',
  'failed',
  'cancelled'
);

CREATE TYPE agent_event_type AS ENUM (
  'step_started',
  'step_completed',
  'step_failed',
  'credential_captured',
  'user_action_required',
  'info'
);

CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type agent_type NOT NULL,
  status agent_run_status NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  cost_usd NUMERIC,
  turns INTEGER,
  error TEXT
);

CREATE TABLE agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  event_type agent_event_type NOT NULL,
  service_name TEXT,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_runs_project ON agent_runs(project_id);
CREATE INDEX idx_agent_runs_user ON agent_runs(user_id);
CREATE INDEX idx_agent_runs_status ON agent_runs(status);
CREATE INDEX idx_agent_events_run ON agent_events(run_id);
CREATE INDEX idx_agent_events_project ON agent_events(project_id);
CREATE INDEX idx_agent_events_created ON agent_events(created_at);

-- RLS
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_runs_owner ON agent_runs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY agent_events_owner ON agent_events
  FOR ALL USING (
    run_id IN (SELECT id FROM agent_runs WHERE user_id = auth.uid())
  );

-- Enable Realtime for agent_events (live progress feed)
ALTER PUBLICATION supabase_realtime ADD TABLE agent_events;
