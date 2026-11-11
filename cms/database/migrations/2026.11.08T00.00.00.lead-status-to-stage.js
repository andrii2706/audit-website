'use strict';

/**
 * Lead field `status` → `stage` (Strapi 5 reserves `status` for draft/published, so the admin could neither show nor
 * edit it). Runs once, before Strapi syncs the schema (which then drops the old column): creates `stage` and copies
 * the values over, so the processing state of existing leads is kept. No-op on new databases.
 */
module.exports = {
  async up(knex) {
    if (!(await knex.schema.hasTable('leads'))) return;
    if (!(await knex.schema.hasColumn('leads', 'status'))) return;
    if (!(await knex.schema.hasColumn('leads', 'stage'))) {
      await knex.schema.alterTable('leads', (t) => t.string('stage'));
    }
    await knex('leads').whereNull('stage').update({ stage: knex.ref('status') });
  },
};
