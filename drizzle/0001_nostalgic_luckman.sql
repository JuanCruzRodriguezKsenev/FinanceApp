CREATE TYPE "public"."transfer_leg" AS ENUM('outflow', 'inflow');--> statement-breakpoint
CREATE TABLE "contact_folder_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folder_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_folder" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"icon" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bank_account" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "contact" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "contact" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "contact" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "contact" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "contact" ADD COLUMN "account_number" text;--> statement-breakpoint
ALTER TABLE "contact" ADD COLUMN "bank_account_type" "bank_account_type";--> statement-breakpoint
ALTER TABLE "contact" ADD COLUMN "is_favorite" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "digital_wallet" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "financial_transaction" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "financial_transaction" ADD COLUMN "currency" text DEFAULT 'ARS' NOT NULL;--> statement-breakpoint
ALTER TABLE "financial_transaction" ADD COLUMN "transfer_group_id" uuid;--> statement-breakpoint
ALTER TABLE "financial_transaction" ADD COLUMN "transfer_leg" "transfer_leg";--> statement-breakpoint
ALTER TABLE "contact_folder_member" ADD CONSTRAINT "contact_folder_member_folder_id_contact_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."contact_folder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_folder_member" ADD CONSTRAINT "contact_folder_member_contact_id_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_folder" ADD CONSTRAINT "contact_folder_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_idempotency_key_unique" UNIQUE("idempotency_key");--> statement-breakpoint
ALTER TABLE "contact" ADD CONSTRAINT "contact_idempotency_key_unique" UNIQUE("idempotency_key");--> statement-breakpoint
ALTER TABLE "digital_wallet" ADD CONSTRAINT "digital_wallet_idempotency_key_unique" UNIQUE("idempotency_key");--> statement-breakpoint
ALTER TABLE "financial_transaction" ADD CONSTRAINT "financial_transaction_idempotency_key_unique" UNIQUE("idempotency_key");