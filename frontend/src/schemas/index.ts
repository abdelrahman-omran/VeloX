import { z } from 'zod';

export const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical', 'unknown']);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const PrStatusSchema = z.enum(['scoring', 'scored', 'error']);
export type PrStatus = z.infer<typeof PrStatusSchema>;

export const CiStatusSchema = z.enum(['pending', 'success', 'failure', 'unknown']);

export const ScoredPrSchema = z.object({
  id: z.string().min(1),
  number: z.number().int().min(1),
  title: z.string().min(1),
  author: z.string().min(1),
  html_url: z.string().url(),
  repo_full_name: z.string().optional(),
  status: PrStatusSchema,
  risk_score: z.number().int().min(1).max(10).nullable(),
  risk_level: RiskLevelSchema.optional(),
  blast_radius_services: z.array(z.string()),
  ai_summary: z.string().nullable(),
  recommended_reviewers: z.array(z.string()),
  ci_status: CiStatusSchema.optional(),
  updated_at: z.string().datetime({ offset: true }),
});

export type ScoredPr = z.infer<typeof ScoredPrSchema>;

export const ActivePrsResponseSchema = z.object({
  items: z.array(ScoredPrSchema),
});

export type ActivePrsResponse = z.infer<typeof ActivePrsResponseSchema>;

export const BlockerSchema = z.object({
  id: z.string(),
  label: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
});

export const BurndownPointSchema = z.object({
  day: z.string(),
  remaining: z.number().min(0),
});

export const SprintHealthSchema = z.object({
  sprint_name: z.string().min(1),
  confidence_percent: z.number().int().min(0).max(100),
  trend: z.enum(['up', 'flat', 'down']),
  burndown: z.array(BurndownPointSchema),
  blockers: z.array(BlockerSchema),
  notes: z.string().optional(),
  updated_at: z.string().datetime({ offset: true }),
});

export type SprintHealth = z.infer<typeof SprintHealthSchema>;

export const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;
