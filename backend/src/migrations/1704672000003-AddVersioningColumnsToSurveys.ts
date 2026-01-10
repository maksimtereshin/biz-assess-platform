import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from "typeorm";

export class AddVersioningColumnsToSurveys1704672000003
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add latest_published_version_id column (nullable)
    await queryRunner.addColumn(
      "surveys",
      new TableColumn({
        name: "latest_published_version_id",
        type: "int",
        isNullable: true,
      })
    );

    // Add foreign key constraint for latest_published_version_id
    await queryRunner.createForeignKey(
      "surveys",
      new TableForeignKey({
        columnNames: ["latest_published_version_id"],
        referencedTableName: "survey_versions",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      })
    );

    // Add deleted_at column for soft delete
    await queryRunner.addColumn(
      "surveys",
      new TableColumn({
        name: "deleted_at",
        type: "timestamptz",
        isNullable: true,
      })
    );

    // Create index on deleted_at for efficient filtering
    await queryRunner.createIndex(
      "surveys",
      new TableIndex({
        name: "IDX_surveys_deleted_at",
        columnNames: ["deleted_at"],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.dropIndex("surveys", "IDX_surveys_deleted_at");

    // Drop deleted_at column
    await queryRunner.dropColumn("surveys", "deleted_at");

    // Drop foreign key for latest_published_version_id
    const table = await queryRunner.getTable("surveys");
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf("latest_published_version_id") !== -1
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey("surveys", foreignKey);
    }

    // Drop latest_published_version_id column
    await queryRunner.dropColumn("surveys", "latest_published_version_id");
  }
}
