import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_contests_consents_type" ADD VALUE 'dataProcessing' BEFORE 'marketing';
  ALTER TYPE "public"."enum_consent_records_type" ADD VALUE 'dataProcessing' BEFORE 'marketing';
  CREATE TABLE "contests_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "contests_steps_locales" (
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "contests" ALTER COLUMN "form_email" SET DEFAULT 'optional';
  ALTER TABLE "participations" ADD COLUMN "period_start" timestamp(3) with time zone;
  -- Only development data can predate this column; the submission time is close enough there.
  UPDATE "participations" SET "period_start" = "submitted_at" WHERE "period_start" IS NULL;
  ALTER TABLE "participations" ALTER COLUMN "period_start" SET NOT NULL;
  ALTER TABLE "contests_steps" ADD CONSTRAINT "contests_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contests_steps_locales" ADD CONSTRAINT "contests_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contests_steps"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "contests_steps_order_idx" ON "contests_steps" USING btree ("_order");
  CREATE INDEX "contests_steps_parent_id_idx" ON "contests_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "contests_steps_locales_locale_parent_id_unique" ON "contests_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "participations_period_start_idx" ON "participations" USING btree ("period_start");
  ALTER TABLE "contests_locales" DROP COLUMN "participation_instructions";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "contests_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contests_steps_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "contests_steps" CASCADE;
  DROP TABLE "contests_steps_locales" CASCADE;
  ALTER TABLE "contests_consents" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "public"."enum_contests_consents_type";
  CREATE TYPE "public"."enum_contests_consents_type" AS ENUM('regulation', 'marketing');
  ALTER TABLE "contests_consents" ALTER COLUMN "type" SET DATA TYPE "public"."enum_contests_consents_type" USING "type"::"public"."enum_contests_consents_type";
  ALTER TABLE "consent_records" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "public"."enum_consent_records_type";
  CREATE TYPE "public"."enum_consent_records_type" AS ENUM('regulation', 'marketing');
  ALTER TABLE "consent_records" ALTER COLUMN "type" SET DATA TYPE "public"."enum_consent_records_type" USING "type"::"public"."enum_consent_records_type";
  DROP INDEX "participations_period_start_idx";
  ALTER TABLE "contests" ALTER COLUMN "form_email" SET DEFAULT 'off';
  ALTER TABLE "contests_locales" ADD COLUMN "participation_instructions" jsonb;
  ALTER TABLE "participations" DROP COLUMN "period_start";`)
}
