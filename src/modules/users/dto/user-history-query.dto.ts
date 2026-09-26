import { z } from 'zod';

export const userHistoryQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});

export type UserHistoryQuery = z.infer<typeof userHistoryQuerySchema>;
