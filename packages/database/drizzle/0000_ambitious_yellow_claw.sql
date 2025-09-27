CREATE TYPE "public"."status" AS ENUM('active', 'pending', 'cancelled');--> statement-breakpoint
CREATE TABLE "better-auth-account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "better-auth-session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "better-auth-session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "better-auth-user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "better-auth-user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "better-auth-verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "membership" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" integer NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"user_id" text NOT NULL,
	"membership_id" text NOT NULL,
	"started_at" date NOT NULL,
	"ended_at" date NOT NULL,
	"status" "status" NOT NULL,
	"external_id" text NOT NULL,
	CONSTRAINT "subscription_user_id_membership_id_pk" PRIMARY KEY("user_id","membership_id")
);
--> statement-breakpoint
ALTER TABLE "better-auth-account" ADD CONSTRAINT "better-auth-account_user_id_better-auth-user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."better-auth-user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "better-auth-session" ADD CONSTRAINT "better-auth-session_user_id_better-auth-user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."better-auth-user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_better-auth-user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."better-auth-user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_membership_id_membership_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."membership"("id") ON DELETE no action ON UPDATE no action;