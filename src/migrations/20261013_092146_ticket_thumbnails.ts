import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tickets" ADD COLUMN "sizes_thumbnail_url" varchar;
  ALTER TABLE "tickets" ADD COLUMN "sizes_thumbnail_width" numeric;
  ALTER TABLE "tickets" ADD COLUMN "sizes_thumbnail_height" numeric;
  ALTER TABLE "tickets" ADD COLUMN "sizes_thumbnail_mime_type" varchar;
  ALTER TABLE "tickets" ADD COLUMN "sizes_thumbnail_filesize" numeric;
  ALTER TABLE "tickets" ADD COLUMN "sizes_thumbnail_filename" varchar;
  CREATE INDEX "tickets_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "tickets" USING btree ("sizes_thumbnail_filename");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "tickets_sizes_thumbnail_sizes_thumbnail_filename_idx";
  ALTER TABLE "tickets" DROP COLUMN "sizes_thumbnail_url";
  ALTER TABLE "tickets" DROP COLUMN "sizes_thumbnail_width";
  ALTER TABLE "tickets" DROP COLUMN "sizes_thumbnail_height";
  ALTER TABLE "tickets" DROP COLUMN "sizes_thumbnail_mime_type";
  ALTER TABLE "tickets" DROP COLUMN "sizes_thumbnail_filesize";
  ALTER TABLE "tickets" DROP COLUMN "sizes_thumbnail_filename";`)
}
