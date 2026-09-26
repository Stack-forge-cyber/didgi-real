import 'dotenv/config';
import { definePrismaConfig } from 'prisma/config';
import { defineConfig as definePostgresConfig } from '@prisma/orm-postgres/config';

export default definePrismaConfig({
  orm: definePostgresConfig({
    contract: './prisma/contract.prisma',
    output: './prisma/generated/prisma8',
    db: {
      connection: process.env['DATABASE_URL'],
    },
    migrations: {
      dir: "./prisma/migrations"
    }
  }),
  skills: {
    check: false,
  }
});
