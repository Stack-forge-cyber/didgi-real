import { describe, expect, it } from 'vitest';

import { withdrawSchema } from '../src/modules/payments/dto/withdraw.dto.js';

describe('withdrawSchema', () => {
    it('rejects non-positive amountCents', () => {
        expect(withdrawSchema.safeParse({ amountCents: 0 }).success).toBe(false);
        expect(withdrawSchema.safeParse({ amountCents: -100 }).success).toBe(false);
    });

    it('accepts positive integer amountCents', () => {
        expect(withdrawSchema.safeParse({ amountCents: 100 }).success).toBe(true);
    });
});
