import { z } from 'zod';

export const createDecisionSchema = z.object({
  title: z.string().min(1).max(100),
  problemStatement: z.string().min(1).max(2000),
  initialOptions: z.array(z.string().min(1).max(100)).optional(),
});

export type CreateDecisionInput = z.infer<typeof createDecisionSchema>;
