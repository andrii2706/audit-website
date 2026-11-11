import knexFactory from 'knex';
import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const migration = require('../database/migrations/2026.11.08T00.00.00.lead-status-to-stage.js');

const db = () => knexFactory({ client: 'better-sqlite3', connection: { filename: ':memory:' }, useNullAsDefault: true });

describe('migration: lead status → stage', () => {
  it('copies the processing state of existing leads', async () => {
    const knex = db();
    await knex.schema.createTable('leads', (t) => { t.increments('id'); t.string('name'); t.string('status'); });
    await knex('leads').insert([{ name: 'A', status: 'done' }, { name: 'B', status: 'in_progress' }, { name: 'C', status: null }]);
    await migration.up(knex);
    expect(await knex('leads').select('name', 'stage').orderBy('id')).toEqual([
      { name: 'A', stage: 'done' }, { name: 'B', stage: 'in_progress' }, { name: 'C', stage: null },
    ]);
    await knex.destroy();
  });
  it('does nothing on a new database', async () => {
    const knex = db();
    await expect(migration.up(knex)).resolves.toBeUndefined();
    await knex.schema.createTable('leads', (t) => { t.increments('id'); t.string('stage'); });
    await expect(migration.up(knex)).resolves.toBeUndefined();
    await knex.destroy();
  });
});
