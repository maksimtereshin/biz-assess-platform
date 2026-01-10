import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateSurveyVersionsAndAdmins1704672000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create admins table
    await queryRunner.createTable(
      new Table({
        name: "admins",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "telegram_username",
            type: "varchar",
            length: "255",
            isUnique: true,
            isNullable: false,
          },
          {
            name: "created_at",
            type: "timestamptz",
            default: "now()",
            isNullable: false,
          },
          {
            name: "created_by_id",
            type: "int",
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ["created_by_id"],
            referencedTableName: "admins",
            referencedColumnNames: ["id"],
            onDelete: "SET NULL",
          },
        ],
      }),
      true
    );

    // Create index on telegram_username for fast lookups
    await queryRunner.createIndex(
      "admins",
      new TableIndex({
        name: "IDX_admins_telegram_username",
        columnNames: ["telegram_username"],
      })
    );

    // Create survey_versions table
    await queryRunner.createTable(
      new Table({
        name: "survey_versions",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "survey_id",
            type: "int",
            isNullable: false,
          },
          {
            name: "version",
            type: "int",
            isNullable: false,
          },
          {
            name: "name",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "type",
            type: "varchar",
            length: "50",
            isNullable: false,
          },
          {
            name: "structure",
            type: "jsonb",
            isNullable: false,
          },
          {
            name: "status",
            type: "varchar",
            length: "50",
            default: "'DRAFT'",
            isNullable: false,
          },
          {
            name: "published_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "created_by_id",
            type: "int",
            isNullable: false,
          },
          {
            name: "created_at",
            type: "timestamptz",
            default: "now()",
            isNullable: false,
          },
          {
            name: "updated_at",
            type: "timestamptz",
            default: "now()",
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ["survey_id"],
            referencedTableName: "surveys",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE",
          },
          {
            columnNames: ["created_by_id"],
            referencedTableName: "admins",
            referencedColumnNames: ["id"],
            onDelete: "RESTRICT",
          },
        ],
      }),
      true
    );

    // Create composite index on (survey_id, version)
    await queryRunner.createIndex(
      "survey_versions",
      new TableIndex({
        name: "IDX_survey_versions_survey_id_version",
        columnNames: ["survey_id", "version"],
      })
    );

    // Create index on status
    await queryRunner.createIndex(
      "survey_versions",
      new TableIndex({
        name: "IDX_survey_versions_status",
        columnNames: ["status"],
      })
    );

    // Create GIN index on JSONB structure field for fast JSONB queries
    await queryRunner.query(
      `CREATE INDEX "IDX_survey_versions_structure" ON "survey_versions" USING GIN ("structure")`
    );

    // Create partial index on status = 'PUBLISHED' for fast retrieval of active versions
    await queryRunner.query(
      `CREATE INDEX "IDX_survey_versions_published" ON "survey_versions" ("survey_id") WHERE "status" = 'PUBLISHED'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_survey_versions_published"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_survey_versions_structure"`
    );
    await queryRunner.dropIndex(
      "survey_versions",
      "IDX_survey_versions_status"
    );
    await queryRunner.dropIndex(
      "survey_versions",
      "IDX_survey_versions_survey_id_version"
    );

    // Drop tables
    await queryRunner.dropTable("survey_versions", true);

    await queryRunner.dropIndex("admins", "IDX_admins_telegram_username");
    await queryRunner.dropTable("admins", true);
  }
}
