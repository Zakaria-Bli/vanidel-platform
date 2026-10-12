import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_draws_status" AS ENUM('completed');
  CREATE TYPE "public"."enum_participations_locale" AS ENUM('fr', 'ar');
  CREATE TYPE "public"."enum_consent_records_type" AS ENUM('regulation', 'marketing');
  CREATE TABLE "draws" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"contest_id" integer NOT NULL,
  	"period_start" timestamp(3) with time zone NOT NULL,
  	"period_end" timestamp(3) with time zone NOT NULL,
  	"status" "enum_draws_status" DEFAULT 'completed' NOT NULL,
  	"eligible_count" numeric NOT NULL,
  	"pool_hash" varchar NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"executed_by_id" integer NOT NULL,
  	"algorithm_version" varchar NOT NULL,
  	"randomness_metadata" jsonb,
  	"redraw_of_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "winners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"draw_id" integer NOT NULL,
  	"participation_id" integer NOT NULL,
  	"rank" numeric NOT NULL,
  	"selected_at" timestamp(3) with time zone NOT NULL,
  	"public_display_name" varchar NOT NULL,
  	"public_media_id" integer,
  	"published" boolean DEFAULT false,
  	"voided" boolean DEFAULT false,
  	"void_reason" varchar,
  	"voided_by_id" integer,
  	"voided_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "participations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"contest_id" integer NOT NULL,
  	"contact_id" integer NOT NULL,
  	"submitted_at" timestamp(3) with time zone NOT NULL,
  	"name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"phone_normalized" varchar NOT NULL,
  	"email" varchar,
  	"wilaya" varchar,
  	"ticket_id" integer NOT NULL,
  	"locale" "enum_participations_locale" NOT NULL,
  	"source" varchar,
  	"utm_source" varchar,
  	"utm_medium" varchar,
  	"utm_campaign" varchar,
  	"utm_content" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tickets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"contest_id" integer NOT NULL,
  	"hash" varchar NOT NULL,
  	"uploaded_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "contacts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"phone_normalized" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"email_normalized" varchar,
  	"wilaya" varchar,
  	"first_contest_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "consent_records" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"contact_id" integer NOT NULL,
  	"participation_id" integer NOT NULL,
  	"type" "enum_consent_records_type" NOT NULL,
  	"granted" boolean DEFAULT false NOT NULL,
  	"text_version" varchar NOT NULL,
  	"captured_at" timestamp(3) with time zone NOT NULL,
  	"source" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "draws_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "winners_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "participations_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tickets_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "contacts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "consent_records_id" integer;
  ALTER TABLE "draws" ADD CONSTRAINT "draws_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "draws" ADD CONSTRAINT "draws_executed_by_id_users_id_fk" FOREIGN KEY ("executed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "draws" ADD CONSTRAINT "draws_redraw_of_id_draws_id_fk" FOREIGN KEY ("redraw_of_id") REFERENCES "public"."draws"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "winners" ADD CONSTRAINT "winners_draw_id_draws_id_fk" FOREIGN KEY ("draw_id") REFERENCES "public"."draws"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "winners" ADD CONSTRAINT "winners_participation_id_participations_id_fk" FOREIGN KEY ("participation_id") REFERENCES "public"."participations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "winners" ADD CONSTRAINT "winners_public_media_id_media_id_fk" FOREIGN KEY ("public_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "winners" ADD CONSTRAINT "winners_voided_by_id_users_id_fk" FOREIGN KEY ("voided_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "participations" ADD CONSTRAINT "participations_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "participations" ADD CONSTRAINT "participations_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "participations" ADD CONSTRAINT "participations_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tickets" ADD CONSTRAINT "tickets_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contacts" ADD CONSTRAINT "contacts_first_contest_id_contests_id_fk" FOREIGN KEY ("first_contest_id") REFERENCES "public"."contests"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_participation_id_participations_id_fk" FOREIGN KEY ("participation_id") REFERENCES "public"."participations"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "draws_contest_idx" ON "draws" USING btree ("contest_id");
  CREATE INDEX "draws_executed_by_idx" ON "draws" USING btree ("executed_by_id");
  CREATE INDEX "draws_redraw_of_idx" ON "draws" USING btree ("redraw_of_id");
  CREATE INDEX "draws_updated_at_idx" ON "draws" USING btree ("updated_at");
  CREATE INDEX "draws_created_at_idx" ON "draws" USING btree ("created_at");
  CREATE INDEX "winners_draw_idx" ON "winners" USING btree ("draw_id");
  CREATE INDEX "winners_participation_idx" ON "winners" USING btree ("participation_id");
  CREATE INDEX "winners_public_media_idx" ON "winners" USING btree ("public_media_id");
  CREATE INDEX "winners_voided_by_idx" ON "winners" USING btree ("voided_by_id");
  CREATE INDEX "winners_updated_at_idx" ON "winners" USING btree ("updated_at");
  CREATE INDEX "winners_created_at_idx" ON "winners" USING btree ("created_at");
  CREATE INDEX "participations_contest_idx" ON "participations" USING btree ("contest_id");
  CREATE INDEX "participations_contact_idx" ON "participations" USING btree ("contact_id");
  CREATE INDEX "participations_ticket_idx" ON "participations" USING btree ("ticket_id");
  CREATE INDEX "participations_updated_at_idx" ON "participations" USING btree ("updated_at");
  CREATE INDEX "participations_created_at_idx" ON "participations" USING btree ("created_at");
  CREATE INDEX "contest_submittedAt_idx" ON "participations" USING btree ("contest_id","submitted_at");
  CREATE INDEX "contest_phoneNormalized_submittedAt_idx" ON "participations" USING btree ("contest_id","phone_normalized","submitted_at");
  CREATE INDEX "tickets_contest_idx" ON "tickets" USING btree ("contest_id");
  CREATE INDEX "tickets_updated_at_idx" ON "tickets" USING btree ("updated_at");
  CREATE INDEX "tickets_created_at_idx" ON "tickets" USING btree ("created_at");
  CREATE UNIQUE INDEX "tickets_filename_idx" ON "tickets" USING btree ("filename");
  CREATE UNIQUE INDEX "contest_hash_idx" ON "tickets" USING btree ("contest_id","hash");
  CREATE UNIQUE INDEX "contacts_phone_normalized_idx" ON "contacts" USING btree ("phone_normalized");
  CREATE INDEX "contacts_first_contest_idx" ON "contacts" USING btree ("first_contest_id");
  CREATE INDEX "contacts_updated_at_idx" ON "contacts" USING btree ("updated_at");
  CREATE INDEX "contacts_created_at_idx" ON "contacts" USING btree ("created_at");
  CREATE INDEX "consent_records_contact_idx" ON "consent_records" USING btree ("contact_id");
  CREATE INDEX "consent_records_participation_idx" ON "consent_records" USING btree ("participation_id");
  CREATE INDEX "consent_records_updated_at_idx" ON "consent_records" USING btree ("updated_at");
  CREATE INDEX "consent_records_created_at_idx" ON "consent_records" USING btree ("created_at");
  CREATE INDEX "contact_type_capturedAt_idx" ON "consent_records" USING btree ("contact_id","type","captured_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_draws_fk" FOREIGN KEY ("draws_id") REFERENCES "public"."draws"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_winners_fk" FOREIGN KEY ("winners_id") REFERENCES "public"."winners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_participations_fk" FOREIGN KEY ("participations_id") REFERENCES "public"."participations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tickets_fk" FOREIGN KEY ("tickets_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contacts_fk" FOREIGN KEY ("contacts_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_consent_records_fk" FOREIGN KEY ("consent_records_id") REFERENCES "public"."consent_records"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_draws_id_idx" ON "payload_locked_documents_rels" USING btree ("draws_id");
  CREATE INDEX "payload_locked_documents_rels_winners_id_idx" ON "payload_locked_documents_rels" USING btree ("winners_id");
  CREATE INDEX "payload_locked_documents_rels_participations_id_idx" ON "payload_locked_documents_rels" USING btree ("participations_id");
  CREATE INDEX "payload_locked_documents_rels_tickets_id_idx" ON "payload_locked_documents_rels" USING btree ("tickets_id");
  CREATE INDEX "payload_locked_documents_rels_contacts_id_idx" ON "payload_locked_documents_rels" USING btree ("contacts_id");
  CREATE INDEX "payload_locked_documents_rels_consent_records_id_idx" ON "payload_locked_documents_rels" USING btree ("consent_records_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "draws" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "winners" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "participations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tickets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contacts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "consent_records" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "draws" CASCADE;
  DROP TABLE "winners" CASCADE;
  DROP TABLE "participations" CASCADE;
  DROP TABLE "tickets" CASCADE;
  DROP TABLE "contacts" CASCADE;
  DROP TABLE "consent_records" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_draws_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_winners_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_participations_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tickets_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_contacts_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_consent_records_fk";
  
  DROP INDEX "payload_locked_documents_rels_draws_id_idx";
  DROP INDEX "payload_locked_documents_rels_winners_id_idx";
  DROP INDEX "payload_locked_documents_rels_participations_id_idx";
  DROP INDEX "payload_locked_documents_rels_tickets_id_idx";
  DROP INDEX "payload_locked_documents_rels_contacts_id_idx";
  DROP INDEX "payload_locked_documents_rels_consent_records_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "draws_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "winners_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "participations_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tickets_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "contacts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "consent_records_id";
  DROP TYPE "public"."enum_draws_status";
  DROP TYPE "public"."enum_participations_locale";
  DROP TYPE "public"."enum_consent_records_type";`)
}
