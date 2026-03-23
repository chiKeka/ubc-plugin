-- Seed data: 5 MVP services (GitHub, Vercel, Supabase, OpenAI, Cloudflare)

INSERT INTO compute_sources (name, provider, description, category, website_url, pricing_url, is_verified, is_active)
VALUES
  ('GitHub', 'GitHub', 'Code hosting, CI/CD with Actions, Packages, Codespaces', 'cloud_infrastructure',
   'https://github.com', 'https://github.com/pricing', true, true),

  ('Vercel', 'Vercel', 'Frontend hosting, serverless functions, edge network', 'cloud_infrastructure',
   'https://vercel.com', 'https://vercel.com/pricing', true, true),

  ('Supabase', 'Supabase', 'Postgres database, Auth, Edge Functions, Realtime, Storage', 'cloud_infrastructure',
   'https://supabase.com', 'https://supabase.com/pricing', true, true),

  ('OpenAI API', 'OpenAI', 'GPT models, embeddings, DALL-E, Whisper', 'ai_llm',
   'https://platform.openai.com', 'https://openai.com/api/pricing/', true, true),

  ('Cloudflare', 'Cloudflare', 'CDN, Workers, Pages, R2 storage, D1 database', 'cloud_infrastructure',
   'https://cloudflare.com', 'https://www.cloudflare.com/plans/', true, true)
ON CONFLICT (name, provider) DO NOTHING;

-- GitHub free tier limits
INSERT INTO free_tier_limits (source_id, limit_name, limit_value, limit_unit, period, notes)
SELECT id, 'GitHub Actions Minutes', 2000, 'minutes', 'monthly', 'For public repos; 500 for private'
FROM compute_sources WHERE name = 'GitHub';

INSERT INTO free_tier_limits (source_id, limit_name, limit_value, limit_unit, period, notes)
SELECT id, 'Packages Storage', 500, 'MB', 'monthly', 'GitHub Packages storage'
FROM compute_sources WHERE name = 'GitHub';

INSERT INTO free_tier_limits (source_id, limit_name, limit_value, limit_unit, period, notes)
SELECT id, 'Codespaces', 120, 'core-hours', 'monthly', '60 hours on 2-core machine'
FROM compute_sources WHERE name = 'GitHub';

-- Vercel free tier limits
INSERT INTO free_tier_limits (source_id, limit_name, limit_value, limit_unit, period, notes)
SELECT id, 'Bandwidth', 100, 'GB', 'monthly', 'Network bandwidth'
FROM compute_sources WHERE name = 'Vercel';

INSERT INTO free_tier_limits (source_id, limit_name, limit_value, limit_unit, period, notes)
SELECT id, 'Serverless Function Execution', 100, 'GB-hours', 'monthly', 'Serverless compute'
FROM compute_sources WHERE name = 'Vercel';

INSERT INTO free_tier_limits (source_id, limit_name, limit_value, limit_unit, period, notes)
SELECT id, 'Build Minutes', 6000, 'minutes', 'monthly', 'Build execution time'
FROM compute_sources WHERE name = 'Vercel';

-- Supabase free tier limits
INSERT INTO free_tier_limits (source_id, limit_name, limit_value, limit_unit, period, notes)
SELECT id, 'Database Size', 500, 'MB', 'total', 'Postgres database'
FROM compute_sources WHERE name = 'Supabase';

INSERT INTO free_tier_limits (source_id, limit_name, limit_value, limit_unit, period, notes)
SELECT id, 'Storage', 1, 'GB', 'total', 'File storage'
FROM compute_sources WHERE name = 'Supabase';

INSERT INTO free_tier_limits (source_id, limit_name, limit_value, limit_unit, period, notes)
SELECT id, 'Edge Function Invocations', 500000, 'invocations', 'monthly', 'Deno edge functions'
FROM compute_sources WHERE name = 'Supabase';

INSERT INTO free_tier_limits (source_id, limit_name, limit_value, limit_unit, period, notes)
SELECT id, 'Auth MAUs', 50000, 'users', 'monthly', 'Monthly active users for auth'
FROM compute_sources WHERE name = 'Supabase';

-- OpenAI free tier limits
INSERT INTO free_tier_limits (source_id, limit_name, limit_value, limit_unit, period, notes)
SELECT id, 'API Credits', 5, 'USD', 'total', 'Free trial credits for new accounts'
FROM compute_sources WHERE name = 'OpenAI API';

INSERT INTO free_tier_limits (source_id, limit_name, limit_value, limit_unit, period, notes)
SELECT id, 'Rate Limit (Tier 1)', 500, 'requests', 'per-minute', 'RPM for GPT-3.5-turbo'
FROM compute_sources WHERE name = 'OpenAI API';

-- Cloudflare free tier limits
INSERT INTO free_tier_limits (source_id, limit_name, limit_value, limit_unit, period, notes)
SELECT id, 'Workers Requests', 100000, 'requests', 'daily', 'Cloudflare Workers invocations'
FROM compute_sources WHERE name = 'Cloudflare';

INSERT INTO free_tier_limits (source_id, limit_name, limit_value, limit_unit, period, notes)
SELECT id, 'Pages Builds', 500, 'builds', 'monthly', 'Cloudflare Pages builds'
FROM compute_sources WHERE name = 'Cloudflare';

INSERT INTO free_tier_limits (source_id, limit_name, limit_value, limit_unit, period, notes)
SELECT id, 'R2 Storage', 10, 'GB', 'monthly', 'Object storage'
FROM compute_sources WHERE name = 'Cloudflare';

INSERT INTO free_tier_limits (source_id, limit_name, limit_value, limit_unit, period, notes)
SELECT id, 'D1 Database', 5, 'GB', 'total', 'SQLite-at-edge database'
FROM compute_sources WHERE name = 'Cloudflare';

-- Normalized metrics
INSERT INTO normalized_metrics (source_id, unit_type, daily_value, weekly_value, monthly_value)
SELECT id, 'compute_minutes', 66.7, 466.7, 2000 FROM compute_sources WHERE name = 'GitHub';

INSERT INTO normalized_metrics (source_id, unit_type, daily_value, weekly_value, monthly_value)
SELECT id, 'compute_minutes', 200, 1400, 6000 FROM compute_sources WHERE name = 'Vercel';

INSERT INTO normalized_metrics (source_id, unit_type, daily_value, weekly_value, monthly_value)
SELECT id, 'api_calls', 16667, 116667, 500000 FROM compute_sources WHERE name = 'Supabase';

INSERT INTO normalized_metrics (source_id, unit_type, daily_value, weekly_value, monthly_value)
SELECT id, 'storage_gb', 0.5, 0.5, 0.5 FROM compute_sources WHERE name = 'Supabase';

INSERT INTO normalized_metrics (source_id, unit_type, daily_value, weekly_value, monthly_value)
SELECT id, 'tokens', 166667, 1166667, 5000000 FROM compute_sources WHERE name = 'OpenAI API'
; -- ~$5 worth of GPT-3.5-turbo tokens

INSERT INTO normalized_metrics (source_id, unit_type, daily_value, weekly_value, monthly_value)
SELECT id, 'requests', 100000, 700000, 3000000 FROM compute_sources WHERE name = 'Cloudflare';

INSERT INTO normalized_metrics (source_id, unit_type, daily_value, weekly_value, monthly_value)
SELECT id, 'storage_gb', 10, 10, 10 FROM compute_sources WHERE name = 'Cloudflare';

-- Recalculate aggregates
SELECT recalculate_aggregate_totals();

-- Use case assignments
INSERT INTO source_use_cases (source_id, use_case, relevance_score)
SELECT id, 'developer_tools', 0.9 FROM compute_sources WHERE name = 'GitHub'
UNION ALL
SELECT id, 'education', 0.7 FROM compute_sources WHERE name = 'GitHub'
UNION ALL
SELECT id, 'developer_tools', 0.9 FROM compute_sources WHERE name = 'Vercel'
UNION ALL
SELECT id, 'productivity', 0.6 FROM compute_sources WHERE name = 'Vercel'
UNION ALL
SELECT id, 'developer_tools', 0.9 FROM compute_sources WHERE name = 'Supabase'
UNION ALL
SELECT id, 'productivity', 0.7 FROM compute_sources WHERE name = 'Supabase'
UNION ALL
SELECT id, 'creative', 0.8 FROM compute_sources WHERE name = 'OpenAI API'
UNION ALL
SELECT id, 'education', 0.8 FROM compute_sources WHERE name = 'OpenAI API'
UNION ALL
SELECT id, 'developer_tools', 0.7 FROM compute_sources WHERE name = 'OpenAI API'
UNION ALL
SELECT id, 'developer_tools', 0.8 FROM compute_sources WHERE name = 'Cloudflare'
UNION ALL
SELECT id, 'productivity', 0.6 FROM compute_sources WHERE name = 'Cloudflare';
