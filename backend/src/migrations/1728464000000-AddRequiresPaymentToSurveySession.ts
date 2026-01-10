import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddRequiresPaymentToSurveySession1728464000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column already exists (idempotent)
    const table = await queryRunner.getTable("survey_sessions");
    const hasColumn = table?.columns.find(
      (col) => col.name === "requires_payment",
    );

    if (!hasColumn) {
      // Add requires_payment column
      await queryRunner.addColumn(
        "survey_sessions",
        new TableColumn({
          name: "requires_payment",
          type: "boolean",
          isNullable: false,
          default: false,
        }),
      );
    }

    // Update existing sessions to false (backward compatibility)
    // This is safe even if column already exists
    await queryRunner.query(`
      UPDATE survey_sessions
      SET requires_payment = false
      WHERE requires_payment IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("survey_sessions", "requires_payment");
  }
}
