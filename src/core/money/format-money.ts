export const formatMoney = (amountCents: bigint): string => {
    const sign = amountCents < 0n ? '-' : '';
    const absolute = amountCents < 0n ? -amountCents : amountCents;
    const dollars = absolute / 100n;
    const cents = absolute % 100n;

    return `${sign}${dollars.toString()}.${cents.toString().padStart(2, '0')}`;
};
