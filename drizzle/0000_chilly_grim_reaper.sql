CREATE TYPE "public"."account_type" AS ENUM('bank', 'wallet', 'cash', 'card');--> statement-breakpoint
CREATE TYPE "public"."bank_account_type" AS ENUM('checking', 'savings', 'investment', 'credit_card', 'debit_card', 'money_market');--> statement-breakpoint
CREATE TYPE "public"."bank" AS ENUM('banco_nacion', 'banco_provincia', 'bbva', 'santander', 'icbc', 'hsbc', 'itau', 'nuevo_banco_bsa', 'macro', 'scotiabank', 'banco_galicia', 'banco_hipotecario', 'banco_industrial', 'banco_ciudad', 'cuenta_dni', 'brubank', 'ual', 'wisfy', 'rebanking', 'otro_banco');--> statement-breakpoint
CREATE TYPE "public"."goal_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."goal_status" AS ENUM('active', 'completed', 'paused');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('bank_transfer', 'debit_card', 'credit_card', 'cash', 'wallet', 'check', 'cryptocurrency', 'other');--> statement-breakpoint
CREATE TYPE "public"."transaction_category" AS ENUM('food', 'transportation', 'entertainment', 'health', 'shopping', 'bills', 'rent', 'utilities', 'subscription', 'insurance', 'taxes', 'salary', 'freelance', 'bonus', 'investment_return', 'passive_income', 'emergency_fund', 'vacation', 'house', 'car', 'education', 'retirement', 'transfer_fee', 'bank_fee', 'interest', 'other');--> statement-breakpoint
CREATE TYPE "public"."transaction_reference_type" AS ENUM('cbu_transfer', 'alias_transfer', 'merchant', 'atm_withdrawal', 'check_number', 'reference_number', 'invoice');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('income', 'expense', 'transfer_own_accounts', 'transfer_third_party', 'withdrawal', 'deposit', 'saving', 'investment', 'refund');--> statement-breakpoint
CREATE TYPE "public"."wallet_provider" AS ENUM('mercado_pago', 'paypal', 'ualá', 'brubank', 'bnext', 'uphold', 'skrill', 'neteller', 'otro_wallet');--> statement-breakpoint
CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	"username" text,
	"password_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "financial_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "account_type" NOT NULL,
	"balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"color" text,
	"icon" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"account_name" text NOT NULL,
	"bank" "bank" NOT NULL,
	"account_type" "bank_account_type" NOT NULL,
	"account_number" text NOT NULL,
	"cbu" text,
	"alias" text,
	"iban" text,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"balance" numeric(15, 2) DEFAULT '0' NOT NULL,
	"owner_name" text NOT NULL,
	"owner_document" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bank_account_cbu_unique" UNIQUE("cbu"),
	CONSTRAINT "bank_account_alias_unique" UNIQUE("alias"),
	CONSTRAINT "bank_account_iban_unique" UNIQUE("iban")
);
--> statement-breakpoint
CREATE TABLE "contact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone_number" text,
	"document" text,
	"cbu" text,
	"alias" text,
	"iban" text,
	"bank" "bank",
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "digital_wallet" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"wallet_name" text NOT NULL,
	"provider" "wallet_provider" NOT NULL,
	"email" text,
	"phone_number" text,
	"username" text,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"balance" numeric(15, 2) DEFAULT '0' NOT NULL,
	"linked_bank_account_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "savings_goal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"target_amount" numeric(12, 2) NOT NULL,
	"current_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"deadline" timestamp,
	"priority" "goal_priority" DEFAULT 'medium' NOT NULL,
	"status" "goal_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"reference_type" "transaction_reference_type",
	"reference_number" text,
	"merchant_name" text,
	"merchant_category" text,
	"merchant_location" text,
	"receipt_url" text,
	"invoice_number" text,
	"tags" text,
	"internal_notes" text,
	"is_reconciled" boolean DEFAULT false,
	"reconciliation_date" timestamp,
	"is_flagged" boolean DEFAULT false,
	"flag_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transaction_metadata_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
CREATE TABLE "financial_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "transaction_type" NOT NULL,
	"category" "transaction_category" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"description" text NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"from_account_id" uuid,
	"to_account_id" uuid,
	"from_bank_account_id" uuid,
	"to_bank_account_id" uuid,
	"from_wallet_id" uuid,
	"to_wallet_id" uuid,
	"contact_id" uuid,
	"transfer_recipient" text,
	"transfer_sender" text,
	"payment_method" "payment_method",
	"goal_id" uuid,
	"is_transfer_between_own_accounts" boolean DEFAULT false,
	"is_transfer_to_third_party" boolean DEFAULT false,
	"is_cash_withdrawal" boolean DEFAULT false,
	"is_cash_deposit" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_account" ADD CONSTRAINT "financial_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact" ADD CONSTRAINT "contact_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_wallet" ADD CONSTRAINT "digital_wallet_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_wallet" ADD CONSTRAINT "digital_wallet_linked_bank_account_id_bank_account_id_fk" FOREIGN KEY ("linked_bank_account_id") REFERENCES "public"."bank_account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_goal" ADD CONSTRAINT "savings_goal_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_metadata" ADD CONSTRAINT "transaction_metadata_transaction_id_financial_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."financial_transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transaction" ADD CONSTRAINT "financial_transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transaction" ADD CONSTRAINT "financial_transaction_from_account_id_financial_account_id_fk" FOREIGN KEY ("from_account_id") REFERENCES "public"."financial_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transaction" ADD CONSTRAINT "financial_transaction_to_account_id_financial_account_id_fk" FOREIGN KEY ("to_account_id") REFERENCES "public"."financial_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transaction" ADD CONSTRAINT "financial_transaction_from_bank_account_id_bank_account_id_fk" FOREIGN KEY ("from_bank_account_id") REFERENCES "public"."bank_account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transaction" ADD CONSTRAINT "financial_transaction_to_bank_account_id_bank_account_id_fk" FOREIGN KEY ("to_bank_account_id") REFERENCES "public"."bank_account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transaction" ADD CONSTRAINT "financial_transaction_from_wallet_id_digital_wallet_id_fk" FOREIGN KEY ("from_wallet_id") REFERENCES "public"."digital_wallet"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transaction" ADD CONSTRAINT "financial_transaction_to_wallet_id_digital_wallet_id_fk" FOREIGN KEY ("to_wallet_id") REFERENCES "public"."digital_wallet"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transaction" ADD CONSTRAINT "financial_transaction_contact_id_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contact"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transaction" ADD CONSTRAINT "financial_transaction_goal_id_savings_goal_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."savings_goal"("id") ON DELETE no action ON UPDATE no action;