import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexesForReportGeneration1729180000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Index for user_telegram_id lookups (used frequently in getUserSessions, getUserCompletedSessionsCount)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_survey_sessions_user_telegram_id
      ON survey_sessions(user_telegram_id);
    `);

    // Index for status filtering (used in completed session queries)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_survey_sessions_status
      ON survey_sessions(status);
    `);

    // Composite index for user + status queries (most common query pattern)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_survey_sessions_user_status
      ON survey_sessions(user_telegram_id, status);
    `);

    // Index for answers by session_id (optimize relation loading)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_answers_session_id
      ON answers(session_id);
    `);

    // Index for created_at for ordering sessions
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_survey_sessions_created_at
      ON survey_sessions(created_at DESC);
    `);

    // Composite index for user sessions ordered by creation
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_survey_sessions_user_created
      ON survey_sessions(user_telegram_id, created_at DESC);
    `);

    // Analyze tables to update statistics for query planner
    await queryRunner.query(`ANALYZE survey_sessions;`);
    await queryRunner.query(`ANALYZE answers;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_survey_sessions_user_created;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_survey_sessions_created_at;`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_answers_session_id;`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_survey_sessions_user_status;`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_survey_sessions_status;`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_survey_sessions_user_telegram_id;`,
    );
  }
}
