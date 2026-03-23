-- V1 base schema: service catalog, limits, metrics, aggregates, history, pipeline
-- Ported from universalbasiccompute v1

-- Enums
CREATE TYPE compute_category AS ENUM (
  'ai_llm',
  'cloud_infrastructure',
  'automation_workflow',
  'data_storage',
  'api_services'
);

CREATE TYPE compute_unit_type AS ENUM (
  'tokens',
  'api_calls',
  'compute_minutes',
  'storage_gb',
  'tasks',
  'requests'
);

CREATE TYPE use_case_category AS ENUM (
  'education',
  'productivity',
  'civic_tools',
  'creative',
  'developer_tools'
);

-- Core service catalog
CREATE TABLE compute_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  description TEXT,
  category compute_category NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  pricing_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, provider)
);

-- Raw free-tier limits per source
CREATE TABLE free_tier_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES compute_sources(id) ON DELETE CASCADE,
  limit_name TEXT NOT NULL,
  limit_value NUMERIC NOT NULL,
  limit_unit TEXT NOT NULL,
  period TEXT NOT NULL DEFAULT 'monthly',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Normalized metrics per source (one per unit_type per source)
CREATE TABLE normalized_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES compute_sources(id) ON DELETE CASCADE,
  unit_type compute_unit_type NOT NULL,
  daily_value NUMERIC,
  weekly_value NUMERIC,
  monthly_value NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_id, unit_type)
);

-- Pre-computed aggregate totals by category and unit type
CREATE TABLE aggregate_totals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category compute_category,
  unit_type compute_unit_type NOT NULL,
  daily_total NUMERIC NOT NULL DEFAULT 0,
  weekly_total NUMERIC NOT NULL DEFAULT 0,
  monthly_total NUMERIC NOT NULL DEFAULT 0,
  source_count INTEGER NOT NULL DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Historical snapshots for trend tracking
CREATE TABLE historical_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES compute_sources(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_normalized_value NUMERIC NOT NULL DEFAULT 0,
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Change log for audit trail
CREATE TABLE change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES compute_sources(id) ON DELETE SET NULL,
  source_name TEXT,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  change_type TEXT,
  run_id UUID,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Use case mappings
CREATE TABLE source_use_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES compute_sources(id) ON DELETE CASCADE,
  use_case use_case_category NOT NULL,
  relevance_score NUMERIC DEFAULT 0.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_id, use_case)
);

-- Indexes for common queries
CREATE INDEX idx_compute_sources_category ON compute_sources(category);
CREATE INDEX idx_compute_sources_active ON compute_sources(is_active);
CREATE INDEX idx_free_tier_limits_source ON free_tier_limits(source_id);
CREATE INDEX idx_normalized_metrics_source ON normalized_metrics(source_id);
CREATE INDEX idx_historical_snapshots_source_date ON historical_snapshots(source_id, snapshot_date);
CREATE INDEX idx_change_log_detected ON change_log(detected_at);

-- RPC: Recalculate aggregate totals
CREATE OR REPLACE FUNCTION recalculate_aggregate_totals()
RETURNS void AS $$
BEGIN
  DELETE FROM aggregate_totals;

  -- Per-category aggregates
  INSERT INTO aggregate_totals (category, unit_type, daily_total, weekly_total, monthly_total, source_count)
  SELECT
    cs.category,
    nm.unit_type,
    COALESCE(SUM(nm.daily_value), 0),
    COALESCE(SUM(nm.weekly_value), 0),
    COALESCE(SUM(nm.monthly_value), 0),
    COUNT(DISTINCT nm.source_id)
  FROM normalized_metrics nm
  JOIN compute_sources cs ON cs.id = nm.source_id
  WHERE cs.is_active = true
  GROUP BY cs.category, nm.unit_type;

  -- Overall aggregates (category = NULL)
  INSERT INTO aggregate_totals (category, unit_type, daily_total, weekly_total, monthly_total, source_count)
  SELECT
    NULL,
    nm.unit_type,
    COALESCE(SUM(nm.daily_value), 0),
    COALESCE(SUM(nm.weekly_value), 0),
    COALESCE(SUM(nm.monthly_value), 0),
    COUNT(DISTINCT nm.source_id)
  FROM normalized_metrics nm
  JOIN compute_sources cs ON cs.id = nm.source_id
  WHERE cs.is_active = true
  GROUP BY nm.unit_type;
END;
$$ LANGUAGE plpgsql;
