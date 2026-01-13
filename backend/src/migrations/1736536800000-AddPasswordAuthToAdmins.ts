import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

export class AddPasswordAuthToAdmins1736536800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add password_hash column (nullable initially)
    await queryRunner.query(`
      ALTER TABLE "admins"
      ADD COLUMN "password_hash" VARCHAR(255)
    `);

    // 2. Generate passwords for existing admins
    const existingAdmins = await queryRunner.query(
      `SELECT id, telegram_username FROM "admins"`,
    );

    const generatedPasswords: { username: string; password: string }[] = [];

    for (const admin of existingAdmins) {
      // Generate secure random password (16 chars, base64)
      const password = crypto.randomBytes(12).toString("base64").slice(0, 16);
      const passwordHash = await bcrypt.hash(password, 10);

      await queryRunner.query(
        `UPDATE "admins" SET "password_hash" = $1 WHERE id = $2`,
        [passwordHash, admin.id],
      );

      generatedPasswords.push({
        username: admin.telegram_username,
        password: password,
      });
    }

    // 3. Make password_hash NOT NULL
    await queryRunner.query(`
      ALTER TABLE "admins"
      ALTER COLUMN "password_hash" SET NOT NULL
    `);

    // 4. Output generated passwords to console
    console.log("\n" + "=".repeat(80));
    console.log("🔐 GENERATED ADMIN PASSWORDS - SAVE THESE SECURELY!");
    console.log("=".repeat(80));
    for (const { username, password } of generatedPasswords) {
      console.log(`Username: ${username}`);
      console.log(`Password: ${password}`);
      console.log("-".repeat(80));
    }
    console.log("=".repeat(80) + "\n");

    // 5. Try to write to file for persistence (use /tmp for write permissions)
    try {
      const outputPath = path.join("/tmp", "admin-passwords.txt");

      let output = "=".repeat(80) + "\n";
      output += "GENERATED ADMIN PASSWORDS\n";
      output += "Generated at: " + new Date().toISOString() + "\n";
      output +=
        "IMPORTANT: Change these passwords immediately after first login!\n";
      output += "=".repeat(80) + "\n\n";

      for (const { username, password } of generatedPasswords) {
        output += `Username: ${username}\n`;
        output += `Password: ${password}\n`;
        output += "-".repeat(80) + "\n";
      }

      fs.writeFileSync(outputPath, output, "utf-8");
      console.log(`📝 Passwords also saved to: ${outputPath}`);
      console.log(
        "⚠️  IMPORTANT: Copy passwords from logs above and delete temp file!\n",
      );
    } catch (error) {
      console.warn(
        "⚠️  Could not save passwords to file. Please copy them from the console output above!",
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: Remove password_hash column
    await queryRunner.query(`
      ALTER TABLE "admins"
      DROP COLUMN "password_hash"
    `);
  }
}
