import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateBotContentTable1736498400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create bot_content table
    await queryRunner.createTable(
      new Table({
        name: "bot_content",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "content_key",
            type: "varchar",
            length: "255",
            isUnique: true,
            isNullable: false,
          },
          {
            name: "content_value",
            type: "text",
            isNullable: false,
          },
          {
            name: "content_type",
            type: "varchar",
            length: "50",
            default: "'message'",
            isNullable: false,
          },
          {
            name: "language",
            type: "varchar",
            length: "10",
            default: "'ru'",
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
      }),
      true,
    );

    // Create unique index on content_key for fast lookups
    await queryRunner.createIndex(
      "bot_content",
      new TableIndex({
        name: "IDX_bot_content_content_key",
        columnNames: ["content_key"],
        isUnique: true,
      }),
    );

    // Create index on language for future multilingual support
    await queryRunner.createIndex(
      "bot_content",
      new TableIndex({
        name: "IDX_bot_content_language",
        columnNames: ["language"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.dropIndex("bot_content", "IDX_bot_content_language");
    await queryRunner.dropIndex("bot_content", "IDX_bot_content_content_key");

    // Drop table
    await queryRunner.dropTable("bot_content", true);
  }
}
