import { Migration } from '@mikro-orm/migrations';

export class Migration20250616024616 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "membership" ("id" text not null, "name" text not null, "description" text not null, "price" integer not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "membership_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_membership_deleted_at" ON "membership" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "subscription" ("id" text not null, "started_at" timestamptz not null, "ended_at" timestamptz not null, "status" text check ("status" in ('active', 'pending', 'cancelled')) not null, "customer_id" text not null, "external_id" text not null, "price" integer not null, "membership_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "subscription_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_LOYALTY_CUSTOMER_ID" ON "subscription" (customer_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_subscription_membership_id" ON "subscription" (membership_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_subscription_deleted_at" ON "subscription" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "subscription" add constraint "subscription_membership_id_foreign" foreign key ("membership_id") references "membership" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "subscription" drop constraint if exists "subscription_membership_id_foreign";`);

    this.addSql(`drop table if exists "membership" cascade;`);

    this.addSql(`drop table if exists "subscription" cascade;`);
  }

}
