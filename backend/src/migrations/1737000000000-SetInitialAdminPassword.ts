import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from "bcryptjs";

/**
 * Migration to set a known admin password from environment variable
 * This allows admins to log in with a predefined password instead of random generated ones
 *
 * Usage:
 * - Set INITIAL_ADMIN_PASSWORD environment variable in Render dashboard
 * - Run migrations: npm run migration:run
 * - Admin can now log in with the password from env var
 *
 * If INITIAL_ADMIN_PASSWORD is not set, this migration does nothing (keeps existing passwords)
 */
export class SetInitialAdminPassword1737000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const initialPassword = process.env.INITIAL_ADMIN_PASSWORD;

    if (!initialPassword) {
      console.log(
        "[Migration] INITIAL_ADMIN_PASSWORD not set. Skipping password update.",
      );
      console.log(
        "[Migration] To set a known admin password, set INITIAL_ADMIN_PASSWORD environment variable and re-run migrations.",
      );
      return;
    }

    // Validate password strength
    if (initialPassword.length < 8) {
      throw new Error(
        "INITIAL_ADMIN_PASSWORD must be at least 8 characters long",
      );
    }

    console.log("\n" + "=".repeat(80));
    console.log("🔐 SETTING ADMIN PASSWORD FROM ENVIRONMENT VARIABLE");
    console.log("=".repeat(80));

    // Hash the password
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    // Get all admins
    const admins = await queryRunner.query(
      `SELECT id, telegram_username FROM "admins"`,
    );

    if (admins.length === 0) {
      console.log("[Migration] No admins found. Nothing to update.");
      return;
    }

    // Update all admins with the new password
    await queryRunner.query(`UPDATE "admins" SET "password_hash" = $1`, [
      passwordHash,
    ]);

    console.log(
      `[Migration] Updated ${admins.length} admin(s) with password from INITIAL_ADMIN_PASSWORD`,
    );
    console.log("\nAdmins that can now log in:");
    for (const admin of admins) {
      console.log(`  - Username: ${admin.telegram_username}`);
    }
    console.log("\nPassword: <value from INITIAL_ADMIN_PASSWORD env var>");
    console.log("=".repeat(80) + "\n");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: This migration is idempotent and doesn't need rollback
    // The previous migration (AddPasswordAuthToAdmins) already set passwords
    console.log(
      "[Migration] SetInitialAdminPassword rollback: No action needed (idempotent)",
    );
  }
}
