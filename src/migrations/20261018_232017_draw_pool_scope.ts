import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_contests_draw_pool_scope" AS ENUM('period', 'sinceStart');
  ALTER TABLE "contests" ADD COLUMN "draw_pool_scope" "enum_contests_draw_pool_scope" DEFAULT 'period' NOT NULL;
  ALTER TABLE "draws" ADD COLUMN "pool_start" timestamp(3) with time zone;`)
  // Every earlier draw picked among its own period's entries.
  await db.execute(sql`
   UPDATE "draws" SET "pool_start" = "period_start";
  ALTER TABLE "draws" ALTER COLUMN "pool_start" SET NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "contests" DROP COLUMN "draw_pool_scope";
  ALTER TABLE "draws" DROP COLUMN "pool_start";
  DROP TYPE "public"."enum_contests_draw_pool_scope";`)
}
