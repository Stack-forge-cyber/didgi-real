import { z } from 'zod';

export const withdrawSchema = z.object({
    amountCents: z.number().int().positive(),
});

export type WithdrawBody = z.infer<typeof withdrawSchema>;
