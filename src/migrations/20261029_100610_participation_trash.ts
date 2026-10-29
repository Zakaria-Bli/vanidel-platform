import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "consent_records" ALTER COLUMN "participation_id" DROP NOT NULL;
  ALTER TABLE "participations" ADD COLUMN "deleted_by_id" integer;
  ALTER TABLE "participations" ADD COLUMN "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "participations" ADD CONSTRAINT "participations_deleted_by_id_users_id_fk" FOREIGN KEY ("deleted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "participations_deleted_by_idx" ON "participations" USING btree ("deleted_by_id");
  CREATE INDEX "participations_deleted_at_idx" ON "participations" USING btree ("deleted_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "participations" DROP CONSTRAINT "participations_deleted_by_id_users_id_fk";
  DROP INDEX "participations_deleted_by_idx";
  DROP INDEX "participations_deleted_at_idx";
  ALTER TABLE "participations" DROP COLUMN "deleted_by_id";
  ALTER TABLE "participations" DROP COLUMN "deleted_at";`)
  // Consent records of participations deleted for good have no participation left to point at;
  // the old schema cannot hold them, so rolling back drops them.
  await db.execute(sql`
   DELETE FROM "consent_records" WHERE "participation_id" IS NULL;
  ALTER TABLE "consent_records" ALTER COLUMN "participation_id" SET NOT NULL;`)
}
