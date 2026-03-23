-- Service signup templates stored in DB for dynamic loading

CREATE TABLE service_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES compute_sources(id) ON DELETE CASCADE,
  template_version INTEGER NOT NULL DEFAULT 1,
  template_yaml TEXT NOT NULL,
  last_verified_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_id, template_version)
);

CREATE INDEX idx_service_templates_source ON service_templates(source_id);
CREATE INDEX idx_service_templates_active ON service_templates(is_active);
