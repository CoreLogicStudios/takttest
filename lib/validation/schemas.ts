import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1),
  start_date: z.string(),
  takt_length_days: z.coerce.number().int().min(1).max(30),
  period_count: z.coerce.number().int().min(1).max(120),
  working_days_mode: z.boolean().default(false)
});

export const zoneSchema = z.object({ name: z.string().min(1), group_name: z.string().optional() });
export const trainSchema = z.object({
  name: z.string().min(1),
  abbreviation: z.string().min(1).max(5),
  color: z.string().regex(/^#([0-9A-Fa-f]{6})$/),
  notes: z.string().optional(),
  active: z.boolean().default(true)
});
