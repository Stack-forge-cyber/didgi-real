import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './generated/prisma8/contract.js';
import contractJson from './generated/prisma8/contract.json' with { type: 'json' };
import 'temporal-polyfill/global';

const databaseUrl = process.env['DATABASE_URL'];

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run seed');
}

const db = postgres<Contract>({ contractJson, url: databaseUrl });

await db.connect();

try {
  await db.orm.public.User.upsert({
    create: {
      id: 1n,
      balanceCents: 10_000n,
    },
    update: {
      balanceCents: 10_000n,
    },
  });
} finally {
  await db.close();
}
