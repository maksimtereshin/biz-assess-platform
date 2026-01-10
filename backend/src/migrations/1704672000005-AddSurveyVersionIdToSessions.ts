import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from "typeorm";

export class AddSurveyVersionIdToSessions1704672000005
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add survey_version_id column as nullable first
    await queryRunner.addColumn(
      "survey_sessions",
      new TableColumn({
        name: "survey_version_id",
        type: "int",
        isNullable: true,
      })
    );

    // Step 2: Populate survey_version_id for all existing sessions
    // Use the latest_published_version_id from their associated survey
    await queryRunner.query(
      `UPDATE "survey_sessions" AS ss
       SET "survey_version_id" = s."latest_published_version_id"
       FROM "surveys" AS s
       WHERE ss."survey_id" = s."id"
       AND s."latest_published_version_id" IS NOT NULL`
    );

    // Step 3: Make survey_version_id NOT NULL
    await queryRunner.changeColumn(
      "survey_sessions",
      "survey_version_id",
      new TableColumn({
        name: "survey_version_id",
        type: "int",
        isNullable: false,
      })
    );

    // Step 4: Add foreign key constraint
    await queryRunner.createForeignKey(
      "survey_sessions",
      new TableForeignKey({
        columnNames: ["survey_version_id"],
        referencedTableName: "survey_versions",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT", // Prevent deletion of versions with active sessions
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    const table = await queryRunner.getTable("survey_sessions");
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf("survey_version_id") !== -1
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey("survey_sessions", foreignKey);
    }

    // Drop column
    await queryRunner.dropColumn("survey_sessions", "survey_version_id");
  }
}
