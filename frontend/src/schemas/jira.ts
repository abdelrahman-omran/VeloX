import { z } from 'zod';

export const JiraIssueSchema = z.object({
  id: z.string(),
  key: z.string(),
  summary: z.string(),
  status: z.string(),
  assignee: z.string().nullable().optional(),
  story_points: z.number().nullable().optional(),
});

export const JiraSprintSchema = z.object({
  id: z.number(),
  name: z.string(),
  state: z.string(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  goal: z.string().nullable().optional(),
  issues: z.array(JiraIssueSchema).default([]),
});

export const JiraSprintsResponseSchema = z.object({
  sprints: z.array(JiraSprintSchema),
});

export type JiraIssue = z.infer<typeof JiraIssueSchema>;
export type JiraSprint = z.infer<typeof JiraSprintSchema>;