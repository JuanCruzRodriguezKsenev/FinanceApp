CREATE TYPE "public"."transaction_state" AS ENUM('DRAFT', 'PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED', 'RECONCILED');--> statement-breakpoint
ALTER TABLE "financial_transaction" ADD COLUMN "state" "transaction_state" DEFAULT 'DRAFT' NOT NULL;--> statement-breakpoint
ALTER TABLE "financial_transaction" ADD COLUMN "state_machine" jsonb;