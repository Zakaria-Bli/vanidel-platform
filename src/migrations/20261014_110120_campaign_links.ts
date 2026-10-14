import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_campaign_links_channel" AS ENUM('qr', 'poster', 'facebook', 'instagram', 'tiktok', 'influencer', 'other');
  CREATE TABLE "campaign_links" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"contest_id" integer NOT NULL,
  	"channel" "enum_campaign_links_channel" NOT NULL,
  	"code" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "campaign_links_id" integer;
  ALTER TABLE "campaign_links" ADD CONSTRAINT "campaign_links_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "campaign_links_contest_idx" ON "campaign_links" USING btree ("contest_id");
  CREATE INDEX "campaign_links_updated_at_idx" ON "campaign_links" USING btree ("updated_at");
  CREATE INDEX "campaign_links_created_at_idx" ON "campaign_links" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_campaign_links_fk" FOREIGN KEY ("campaign_links_id") REFERENCES "public"."campaign_links"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_campaign_links_id_idx" ON "payload_locked_documents_rels" USING btree ("campaign_links_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "campaign_links" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "campaign_links" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_campaign_links_fk";
  
  DROP INDEX "payload_locked_documents_rels_campaign_links_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "campaign_links_id";
  DROP TYPE "public"."enum_campaign_links_channel";`)
}
