import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_contests_consents_type" AS ENUM('regulation', 'marketing');
  CREATE TYPE "public"."enum_contests_form_email" AS ENUM('off', 'optional', 'required');
  CREATE TYPE "public"."enum_contests_draw_period_start_day" AS ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');
  CREATE TYPE "public"."enum_contests_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_settings_social_links_platform" AS ENUM('facebook', 'instagram', 'tiktok', 'youtube');
  CREATE TABLE "contests_prizes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"quantity" numeric
  );
  
  CREATE TABLE "contests_prizes_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "contests_consents" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_contests_consents_type" NOT NULL,
  	"required" boolean DEFAULT false,
  	"text_version" varchar NOT NULL
  );
  
  CREATE TABLE "contests_consents_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "contests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_media_id" integer,
  	"form_email" "enum_contests_form_email" DEFAULT 'off' NOT NULL,
  	"form_wilaya_required" boolean DEFAULT true,
  	"entry_limit_per_phone" numeric DEFAULT 1 NOT NULL,
  	"draw_period_days" numeric DEFAULT 7 NOT NULL,
  	"draw_period_start_day" "enum_contests_draw_period_start_day",
  	"draw_winners_per_draw" numeric DEFAULT 1 NOT NULL,
  	"share_media_id" integer,
  	"slug" varchar NOT NULL,
  	"status" "enum_contests_status" DEFAULT 'draft' NOT NULL,
  	"start_at" timestamp(3) with time zone NOT NULL,
  	"end_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "contests_locales" (
  	"title" varchar NOT NULL,
  	"description" jsonb,
  	"participation_instructions" jsonb,
  	"regulation_id" integer,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "settings_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_settings_social_links_platform" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"meta_pixel_id" varchar,
  	"ga4_id" varchar,
  	"retention_days" numeric,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "settings_locales" (
  	"privacy_text" jsonb,
  	"legal_text" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "media" ADD COLUMN "sizes_hero_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_hero_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_hero_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_hero_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_hero_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_hero_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_og_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_og_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_og_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_og_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_og_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_og_filename" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "contests_id" integer;
  ALTER TABLE "contests_prizes" ADD CONSTRAINT "contests_prizes_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contests_prizes" ADD CONSTRAINT "contests_prizes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contests_prizes_locales" ADD CONSTRAINT "contests_prizes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contests_prizes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contests_consents" ADD CONSTRAINT "contests_consents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contests_consents_locales" ADD CONSTRAINT "contests_consents_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contests_consents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contests" ADD CONSTRAINT "contests_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contests" ADD CONSTRAINT "contests_share_media_id_media_id_fk" FOREIGN KEY ("share_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contests_locales" ADD CONSTRAINT "contests_locales_regulation_id_media_id_fk" FOREIGN KEY ("regulation_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contests_locales" ADD CONSTRAINT "contests_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "settings_social_links" ADD CONSTRAINT "settings_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "settings_locales" ADD CONSTRAINT "settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "contests_prizes_order_idx" ON "contests_prizes" USING btree ("_order");
  CREATE INDEX "contests_prizes_parent_id_idx" ON "contests_prizes" USING btree ("_parent_id");
  CREATE INDEX "contests_prizes_media_idx" ON "contests_prizes" USING btree ("media_id");
  CREATE UNIQUE INDEX "contests_prizes_locales_locale_parent_id_unique" ON "contests_prizes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "contests_consents_order_idx" ON "contests_consents" USING btree ("_order");
  CREATE INDEX "contests_consents_parent_id_idx" ON "contests_consents" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "contests_consents_locales_locale_parent_id_unique" ON "contests_consents_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "contests_hero_media_idx" ON "contests" USING btree ("hero_media_id");
  CREATE INDEX "contests_share_media_idx" ON "contests" USING btree ("share_media_id");
  CREATE UNIQUE INDEX "contests_slug_idx" ON "contests" USING btree ("slug");
  CREATE INDEX "contests_updated_at_idx" ON "contests" USING btree ("updated_at");
  CREATE INDEX "contests_created_at_idx" ON "contests" USING btree ("created_at");
  CREATE INDEX "contests_regulation_idx" ON "contests_locales" USING btree ("regulation_id","_locale");
  CREATE UNIQUE INDEX "contests_locales_locale_parent_id_unique" ON "contests_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "settings_social_links_order_idx" ON "settings_social_links" USING btree ("_order");
  CREATE INDEX "settings_social_links_parent_id_idx" ON "settings_social_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "settings_locales_locale_parent_id_unique" ON "settings_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contests_fk" FOREIGN KEY ("contests_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE INDEX "payload_locked_documents_rels_contests_id_idx" ON "payload_locked_documents_rels" USING btree ("contests_id");
  INSERT INTO "media_locales" ("alt", "_locale", "_parent_id") SELECT "alt", 'fr', "id" FROM "media";
  ALTER TABLE "media" DROP COLUMN "alt";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "alt" varchar;
  UPDATE "media" SET "alt" = coalesce(
    (SELECT "alt" FROM "media_locales" WHERE "_parent_id" = "media"."id" ORDER BY "_locale" = 'fr' DESC LIMIT 1),
    ''
  );
   ALTER TABLE "contests_prizes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contests_prizes_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contests_consents" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contests_consents_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contests" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contests_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "media_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "settings_social_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "settings_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "contests_prizes" CASCADE;
  DROP TABLE "contests_prizes_locales" CASCADE;
  DROP TABLE "contests_consents" CASCADE;
  DROP TABLE "contests_consents_locales" CASCADE;
  DROP TABLE "contests" CASCADE;
  DROP TABLE "contests_locales" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "settings_social_links" CASCADE;
  DROP TABLE "settings" CASCADE;
  DROP TABLE "settings_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_contests_fk";
  
  DROP INDEX "media_sizes_hero_sizes_hero_filename_idx";
  DROP INDEX "media_sizes_og_sizes_og_filename_idx";
  DROP INDEX "payload_locked_documents_rels_contests_id_idx";
  ALTER TABLE "media" ALTER COLUMN "alt" SET NOT NULL;
  ALTER TABLE "media" DROP COLUMN "sizes_hero_url";
  ALTER TABLE "media" DROP COLUMN "sizes_hero_width";
  ALTER TABLE "media" DROP COLUMN "sizes_hero_height";
  ALTER TABLE "media" DROP COLUMN "sizes_hero_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_hero_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_hero_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_og_url";
  ALTER TABLE "media" DROP COLUMN "sizes_og_width";
  ALTER TABLE "media" DROP COLUMN "sizes_og_height";
  ALTER TABLE "media" DROP COLUMN "sizes_og_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_og_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_og_filename";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "contests_id";
  DROP TYPE "public"."enum_contests_consents_type";
  DROP TYPE "public"."enum_contests_form_email";
  DROP TYPE "public"."enum_contests_draw_period_start_day";
  DROP TYPE "public"."enum_contests_status";
  DROP TYPE "public"."enum_settings_social_links_platform";`)
}
