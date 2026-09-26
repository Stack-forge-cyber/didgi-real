import { z } from 'zod';

export const userIdSchema = z.coerce.number().int().positive().safe();

export type UserId = z.infer<typeof userIdSchema>;
