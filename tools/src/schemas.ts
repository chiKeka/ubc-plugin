/**
 * Zod schemas for Bricolage protocol content.
 *
 * The three YAML files in /protocol/ describe the shape of domain
 * descriptors, resources, and patterns. These Zod schemas are the
 * executable counterpart: they run at load time, reject malformed
 * content with actionable errors, and keep the protocol from drifting
 * back into a convention.
 *
 * When you change the protocol, change it here first, then update the
 * YAML reference files in /protocol/ to match.
 */

import { z } from "zod";

// ── Shared primitives ─────────────────────────────────────────────────

/** ISO 8601 date string (YYYY-MM-DD or full datetime). */
const IsoDate = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/,
    { message: "verified_at must be an ISO date (YYYY-MM-DD or full ISO datetime)" }
  );

/**
 * free_tier_type classifies *why* a free tier exists, which predicts
 * how durable it is. This is the single most important piece of
 * metadata for a free-resource protocol — it's what tells the planner
 * whether to prefer a resource for long-lived projects.
 *
 * cac_funded:    Customer acquisition. Funded by expected conversion
 *                to paid. Decays when unit economics change.
 *                (Vercel, Supabase, Resend, most SaaS freemium.)
 * public_good:   Funded by a non-commercial institution or programme.
 *                Gated but durable while the institution exists.
 *                (GitHub Education, .edu access, government datasets.)
 * cross_subsidy: A free tier sustained by paying customers elsewhere
 *                in the same business. Durable while the paid business
 *                holds. (Cloudflare's free CDN, Google's free quotas.)
 * community:     Volunteer-operated or donation-funded. Availability
 *                tracks donations and maintainer attention.
 *                (Many open-source hosting projects.)
 * trial:         Time-limited. Should be flagged, not relied upon.
 * unknown:       Not yet classified. Planner should treat as cac_funded.
 */
export const FreeTierType = z.enum([
  "cac_funded",
  "public_good",
  "cross_subsidy",
  "community",
  "trial",
  "unknown",
]);
export type FreeTierType = z.infer<typeof FreeTierType>;

/**
 * trust_level classifies the provenance of a domain itself.
 *
 * blessed:          Ships with the plugin; reviewed by maintainers.
 * user_scaffolded:  Created locally by the discovery agent. Not reviewed.
 *                   Agents should warn users before treating its content
 *                   as authoritative.
 * external:         Added from an outside source (future: signed registry).
 */
export const TrustLevel = z.enum(["blessed", "user_scaffolded", "external"]);
export type TrustLevel = z.infer<typeof TrustLevel>;

// ── Domain descriptor ─────────────────────────────────────────────────

export const DomainSchema = z.object({
  id: z.string().min(1).regex(/^[a-z][a-z0-9_-]*$/, {
    message: "Domain id must be lowercase slug (letters, digits, hyphens, underscores)",
  }),
  name: z.string().min(1),
  description: z.string().min(1),

  version: z.string().optional(),
  created_at: IsoDate.optional(),
  categories: z.array(z.string()).optional(),
  resource_types: z.array(z.string()).optional(),
  access_types: z.array(z.string()).optional(),
  assembly_verbs: z.array(z.string()).optional(),
  outcome_types: z.array(z.string()).optional(),
  maintainer: z.string().optional(),

  // New: provenance marker. Defaults to user_scaffolded so that domains
  // without an explicit declaration are not silently trusted.
  trust_level: TrustLevel.optional().default("user_scaffolded"),

  // New: last full-catalog review date for the whole domain.
  verified_at: IsoDate.optional(),
});
export type Domain = z.infer<typeof DomainSchema>;

// ── Resource: detailed (Tier 1) ───────────────────────────────────────

const FreeTierLimitSchema = z.object({
  name: z.string(),
  value: z.union([z.number(), z.string()]),
  unit: z.string(),
  notes: z.string().optional(),
});

const SignupSchema = z.object({
  url: z.string().url(),
  method: z.string().optional(),
  requires: z.string().optional(),
  steps: z.array(z.string()).optional(),
});

const HowToGetSchema = z.object({
  url: z.string().url(),
  steps: z.array(z.string()),
});

const CredentialSchema = z.object({
  name: z.string(),
  env_var: z.string(),
  type: z.string(),
  optional: z.boolean().optional(),
  sensitive: z.boolean().optional(),
  how_to_get: HowToGetSchema,
  validation: z.string().optional(),
});

export const ResourceSchema = z
  .object({
    name: z.string().min(1),
    provider: z.string().min(1),
    category: z.string().min(1),
    website: z.string().url(),
    pricing_url: z.string().url().optional(),
    description: z.string().min(1),

    // Detailed form: list of limit objects.
    // Bulk catalog uses a plain string — see CatalogEntrySchema below.
    free_tier: z.array(FreeTierLimitSchema),

    signup: SignupSchema.optional(),
    credentials: z.array(CredentialSchema).optional(),

    provides: z.array(z.string()).optional(),
    depends_on: z.array(z.string()).optional(),
    limits: z.array(z.unknown()).optional(),
    notes: z.string().optional(),

    // New: durability metadata.
    free_tier_type: FreeTierType.optional().default("unknown"),

    // Staleness. If absent, treated as never-verified.
    verified_at: IsoDate.optional(),
  })
  .passthrough(); // allow provider-specific extras without rejecting

export type Resource = z.infer<typeof ResourceSchema>;

// ── Resource: bulk catalog entry (Tier 2) ────────────────────────────

export const CatalogEntrySchema = z
  .object({
    name: z.string().min(1),
    provider: z.string().min(1),
    category: z.string().min(1),
    website: z.string().url(),
    description: z.string().min(1),
    free_tier: z.string(),
    free_tier_type: FreeTierType.optional().default("unknown"),
    verified_at: IsoDate.optional(),
  })
  .passthrough();
export type CatalogEntry = z.infer<typeof CatalogEntrySchema>;

// ── Patterns ─────────────────────────────────────────────────────────

const PatternResourceSchema = z.object({
  resource: z.string().min(1),
  role: z.string().min(1),
  reason: z.string().min(1),
});

// Legacy compute-domain shape. Kept for backward compatibility; the
// pattern loader normalizes it to PatternResourceSchema at read time.
const LegacyPatternServiceSchema = z.object({
  service: z.string().min(1),
  role: z.string().min(1),
  reason: z.string().min(1),
});

const PatternStepSchema = z.object({
  name: z.string(),
  description: z.string(),
  resource: z.string().optional(),
  verification: z.string().optional(),
});

export const PatternSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/, {
      message: "Pattern id must be lowercase kebab-case",
    }),
    name: z.string().min(1),
    description: z.string().min(1),
    icon: z.string().optional(),

    // At least one of resources / services must be present. The loader
    // normalizes legacy "services" to "resources" before returning.
    resources: z.array(PatternResourceSchema).optional(),
    services: z.array(LegacyPatternServiceSchema).optional(),

    builds: z
      .object({
        framework: z.string(),
        features: z.array(z.string()),
        deploy_to: z.string(),
      })
      .optional(),

    outcome: z.string().optional(),
    steps: z.array(PatternStepSchema).optional(),
    estimated_effort: z.string().optional(),
    estimated_usage: z.record(z.string()).optional(),
    prerequisites: z.array(z.string()).optional(),
    alternatives: z.array(z.string()).optional(),
    warnings: z.array(z.string()).optional(),
  })
  .passthrough()
  .refine((p) => (p.resources && p.resources.length > 0) || (p.services && p.services.length > 0), {
    message: "Pattern must declare at least one resource (or legacy 'service')",
  });
export type Pattern = z.infer<typeof PatternSchema>;

// ── Staleness helpers ─────────────────────────────────────────────────

/**
 * Thresholds for decay of a free-tier claim.
 *
 * Free tiers change often. The Heroku-in-2022 case is the canonical
 * example: a tier marketed as free for a decade disappeared in weeks.
 * The catalog defends against this by aging verifications.
 */
export const STALENESS_WARN_DAYS = 90;
export const STALENESS_STALE_DAYS = 180;

export type StalenessLevel = "fresh" | "warn" | "stale" | "unknown";

export function stalenessLevel(
  verifiedAt: string | undefined,
  now: Date = new Date()
): StalenessLevel {
  if (!verifiedAt) return "unknown";
  const then = new Date(verifiedAt);
  if (Number.isNaN(then.getTime())) return "unknown";
  const days = (now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24);
  if (days < STALENESS_WARN_DAYS) return "fresh";
  if (days < STALENESS_STALE_DAYS) return "warn";
  return "stale";
}
