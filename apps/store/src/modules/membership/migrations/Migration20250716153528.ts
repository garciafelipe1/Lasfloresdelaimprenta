import { Migration } from '@mikro-orm/migrations';

export class Migration20250716153528 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "membership" add constraint "membership_name_check" check("name" in ('Esencial', 'Premium', 'Elite'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "membership" drop constraint if exists "membership_name_check";`);

    this.addSql(`alter table if exists "membership" alter column "name" type text using ("name"::text);`);
  }

}
