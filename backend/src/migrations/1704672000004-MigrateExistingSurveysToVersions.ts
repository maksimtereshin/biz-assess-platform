import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrateExistingSurveysToVersions1704672000004
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get the first admin ID to use as created_by for all initial versions
    const adminResult = await queryRunner.query(
      `SELECT "id" FROM "admins" WHERE "created_by_id" IS NULL LIMIT 1`
    );

    if (!adminResult || adminResult.length === 0) {
      throw new Error(
        "No bootstrap admin found. Run SeedInitialAdmins migration first."
      );
    }

    const firstAdminId = adminResult[0].id;

    // Get all existing surveys
    const surveys = await queryRunner.query(
      `SELECT "id", "type", "name", "structure" FROM "surveys"`
    );

    // For each survey, create version 1 as PUBLISHED
    for (const survey of surveys) {
      const versionResult = await queryRunner.query(
        `INSERT INTO "survey_versions"
         ("survey_id", "version", "name", "type", "structure", "status", "published_at", "created_by_id")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
         RETURNING "id"`,
        [
          survey.id,
          1, // version 1
          survey.name,
          survey.type,
          JSON.stringify(survey.structure), // JSONB field
          "PUBLISHED",
          firstAdminId,
        ]
      );

      const versionId = versionResult[0].id;

      // Update survey.latest_published_version_id to point to the newly created version
      await queryRunner.query(
        `UPDATE "surveys" SET "latest_published_version_id" = $1 WHERE "id" = $2`,
        [versionId, survey.id]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Clear latest_published_version_id from all surveys
    await queryRunner.query(
      `UPDATE "surveys" SET "latest_published_version_id" = NULL`
    );

    // Delete all survey_versions with version = 1
    // (these are the versions created by this migration)
    await queryRunner.query(
      `DELETE FROM "survey_versions" WHERE "version" = 1`
    );
  }
}
