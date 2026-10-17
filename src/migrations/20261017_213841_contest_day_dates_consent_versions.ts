import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "contests_consents" ALTER COLUMN "text_version" DROP NOT NULL;`)
  // Contests now end on the last millisecond of their last day instead of at 00:00 the next day.
  // Move existing midnight ends back by one millisecond: the same closing time, but shown as the
  // right last day in the day-only picker, and kept on the next save.
  await db.execute(sql`
   UPDATE "contests" SET "end_at" = "end_at" - interval '1 millisecond'
   WHERE ("end_at" AT TIME ZONE 'Africa/Algiers')::time = '00:00';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "contests_consents" ALTER COLUMN "text_version" SET NOT NULL;`)
}
