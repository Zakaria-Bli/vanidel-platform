import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE INDEX "contests_steps_locales_parent_id_idx" ON "contests_steps_locales" USING btree ("_parent_id");
  CREATE INDEX "contests_prizes_locales_parent_id_idx" ON "contests_prizes_locales" USING btree ("_parent_id");
  CREATE INDEX "contests_consents_locales_parent_id_idx" ON "contests_consents_locales" USING btree ("_parent_id");
  CREATE INDEX "contests_locales_parent_id_idx" ON "contests_locales" USING btree ("_parent_id");
  CREATE INDEX "media_locales_parent_id_idx" ON "media_locales" USING btree ("_parent_id");
  CREATE INDEX "settings_locales_parent_id_idx" ON "settings_locales" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "contests_steps_locales_parent_id_idx";
  DROP INDEX "contests_prizes_locales_parent_id_idx";
  DROP INDEX "contests_consents_locales_parent_id_idx";
  DROP INDEX "contests_locales_parent_id_idx";
  DROP INDEX "media_locales_parent_id_idx";
  DROP INDEX "settings_locales_parent_id_idx";`)
}
