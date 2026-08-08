import { z } from 'zod';

export const RepoFullNameSchema = z
  .string()
  .trim()
  .regex(/^[\w.-]+\/[\w.-]+$/, 'Use owner/repo (e.g. example/acme-payments)');

export const WebhookStatusSchema = z.enum(['unknown', 'pending', 'ok']);
export type WebhookStatus = z.infer<typeof WebhookStatusSchema>;

export const LinkedProjectSchema = z.object({
  id: z.string().min(1),
  full_name: RepoFullNameSchema,
  linked_at: z.string().datetime({ offset: true }),
  webhook_status: WebhookStatusSchema,
});

export type LinkedProject = z.infer<typeof LinkedProjectSchema>;

export const ProjectStoreSchema = z.object({
  projects: z.array(LinkedProjectSchema),
  activeProjectId: z.string().nullable(),
});

export type ProjectStoreState = z.infer<typeof ProjectStoreSchema>;

export const DEFAULT_FIXTURE_REPO = 'example/acme-payments';
