#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/4a8af9a50118d2e436835a35a9688b658cf5fa12dc82577a9560865f4dac540a/contract';
import endContract from '../../snapshots/4a8af9a50118d2e436835a35a9688b658cf5fa12dc82577a9560865f4dac540a/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'balance_history',
        columns: [
          col('action', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('amount_cents', 'int8', { notNull: true, codecRef: { codecId: 'pg/int8@1' } }),
          col('balance_after_cents', 'int8', { notNull: true, codecRef: { codecId: 'pg/int8@1' } }),
          col('balance_before_cents', 'int8', {
            notNull: true,
            codecRef: { codecId: 'pg/int8@1' },
          }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('idempotency_key', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('user_id', 'int8', { notNull: true, codecRef: { codecId: 'pg/int8@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'users',
        columns: [
          col('balance_cents', 'int8', { notNull: true, codecRef: { codecId: 'pg/int8@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'int8', { notNull: true, codecRef: { codecId: 'pg/int8@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'balance_history',
        index: 'balance_history_user_id_created_at_idx_b562028f',
        columns: ['user_id', 'created_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'balance_history',
        index: 'balance_history_user_id_idx_6c952402',
        columns: ['user_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'balance_history',
        foreignKey: {
          name: 'balance_history_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
