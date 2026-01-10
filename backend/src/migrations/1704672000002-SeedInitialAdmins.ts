import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedInitialAdmins1704672000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if admins table is already populated
    const existingAdmins = await queryRunner.query(
      `SELECT COUNT(*) as count FROM "admins"`
    );

    const adminCount = parseInt(existingAdmins[0].count);

    if (adminCount > 0) {
      console.log(
        `[Migration] Admins table already has ${adminCount} admin(s). Skipping seed.`
      );
      return;
    }

    // Get owner username from environment variable (production) or use default (development)
    const ownerUsername =
      process.env.ADMIN_TELEGRAM_USERNAME || "maksim_tereshin";
    const isProduction = process.env.NODE_ENV === "production";

    console.log(
      `[Migration] Seeding initial admin: ${ownerUsername} (production: ${isProduction})`
    );

    // Insert first admin (owner) with created_by = NULL (bootstrap admin)
    const ownerResult = await queryRunner.query(
      `INSERT INTO "admins" ("telegram_username", "created_by_id")
       VALUES ($1, NULL)
       RETURNING "id"`,
      [ownerUsername]
    );

    const ownerId = ownerResult[0].id;

    // Insert second admin (test admin) only in non-production environments
    if (!isProduction) {
      console.log(
        `[Migration] Development environment detected. Adding test admin: bogdanov_admin`
      );
      await queryRunner.query(
        `INSERT INTO "admins" ("telegram_username", "created_by_id")
         VALUES ($1, $2)`,
        ["bogdanov_admin", ownerId]
      );
    }

    console.log(`[Migration] Admin seeding complete.`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete all seeded admins
    await queryRunner.query(`DELETE FROM "admins" WHERE "created_by_id" IS NULL`);
    console.log(`[Migration] Removed all bootstrap admins.`);
  }
}
