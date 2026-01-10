import { DataSource } from "typeorm";
import { CreateSurveyVersionsAndAdmins1704672000001 } from "./1704672000001-CreateSurveyVersionsAndAdmins";
import { SeedInitialAdmins1704672000002 } from "./1704672000002-SeedInitialAdmins";
import { AddVersioningColumnsToSurveys1704672000003 } from "./1704672000003-AddVersioningColumnsToSurveys";
import { MigrateExistingSurveysToVersions1704672000004 } from "./1704672000004-MigrateExistingSurveysToVersions";
import { AddSurveyVersionIdToSessions1704672000005 } from "./1704672000005-AddSurveyVersionIdToSessions";
import { Admin } from "../entities/admin.entity";
import { Survey } from "../entities/survey.entity";
import { SurveyVersion } from "../entities/survey-version.entity";
import { SurveySession } from "../entities/survey-session.entity";

describe("Database Migrations", () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    // Create test database connection
    dataSource = new DataSource({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || "postgres",
      password: process.env.DB_PASSWORD || "password",
      database: process.env.DB_NAME_TEST || "bizass_platform_test",
      entities: [Admin, Survey, SurveyVersion, SurveySession],
      synchronize: false,
      logging: false,
    });

    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  describe("Migration #1: CreateSurveyVersionsAndAdmins", () => {
    it("should create admins and survey_versions tables with correct structure", async () => {
      const migration = new CreateSurveyVersionsAndAdmins1704672000001();
      const queryRunner = dataSource.createQueryRunner();

      await migration.up(queryRunner);

      // Check admins table exists
      const adminsTable = await queryRunner.getTable("admins");
      expect(adminsTable).toBeDefined();
      expect(adminsTable.columns.find((c) => c.name === "telegram_username"))
        .toBeDefined();

      // Check survey_versions table exists
      const versionsTable = await queryRunner.getTable("survey_versions");
      expect(versionsTable).toBeDefined();
      expect(versionsTable.columns.find((c) => c.name === "structure"))
        .toBeDefined();

      // Check GIN index on structure exists
      const indexes = await queryRunner.query(
        `SELECT indexname FROM pg_indexes WHERE tablename = 'survey_versions' AND indexdef LIKE '%USING gin%'`
      );
      expect(indexes.length).toBeGreaterThan(0);

      await migration.down(queryRunner);
      await queryRunner.release();
    });

    it("should rollback correctly (down method)", async () => {
      const migration = new CreateSurveyVersionsAndAdmins1704672000001();
      const queryRunner = dataSource.createQueryRunner();

      await migration.up(queryRunner);
      await migration.down(queryRunner);

      const adminsTable = await queryRunner.getTable("admins");
      const versionsTable = await queryRunner.getTable("survey_versions");

      expect(adminsTable).toBeNull();
      expect(versionsTable).toBeNull();

      await queryRunner.release();
    });
  });

  describe("Migration #2: SeedInitialAdmins", () => {
    it("should seed two administrators correctly", async () => {
      const migration1 = new CreateSurveyVersionsAndAdmins1704672000001();
      const migration2 = new SeedInitialAdmins1704672000002();
      const queryRunner = dataSource.createQueryRunner();

      await migration1.up(queryRunner);
      await migration2.up(queryRunner);

      const admins = await queryRunner.query(`SELECT * FROM "admins"`);

      expect(admins.length).toBe(2);
      expect(admins[0].telegram_username).toBe("maksim_tereshin");
      expect(admins[0].created_by_id).toBeNull();
      expect(admins[1].telegram_username).toBe("bogdanov_admin");
      expect(admins[1].created_by_id).toBe(admins[0].id);

      await migration2.down(queryRunner);
      await migration1.down(queryRunner);
      await queryRunner.release();
    });
  });

  describe("Migration #3: AddVersioningColumnsToSurveys", () => {
    it("should add versioning columns to surveys table", async () => {
      const migration1 = new CreateSurveyVersionsAndAdmins1704672000001();
      const migration3 = new AddVersioningColumnsToSurveys1704672000003();
      const queryRunner = dataSource.createQueryRunner();

      await migration1.up(queryRunner);
      await migration3.up(queryRunner);

      const surveysTable = await queryRunner.getTable("surveys");
      const latestVersionCol = surveysTable.columns.find(
        (c) => c.name === "latest_published_version_id"
      );
      const deletedAtCol = surveysTable.columns.find(
        (c) => c.name === "deleted_at"
      );

      expect(latestVersionCol).toBeDefined();
      expect(deletedAtCol).toBeDefined();

      await migration3.down(queryRunner);
      await migration1.down(queryRunner);
      await queryRunner.release();
    });
  });

  describe("Migration #4: MigrateExistingSurveysToVersions", () => {
    it("should migrate existing surveys to version 1", async () => {
      const migration1 = new CreateSurveyVersionsAndAdmins1704672000001();
      const migration2 = new SeedInitialAdmins1704672000002();
      const migration3 = new AddVersioningColumnsToSurveys1704672000003();
      const migration4 = new MigrateExistingSurveysToVersions1704672000004();
      const queryRunner = dataSource.createQueryRunner();

      await migration1.up(queryRunner);
      await migration2.up(queryRunner);
      await migration3.up(queryRunner);

      // Create a test survey
      await queryRunner.query(
        `INSERT INTO "surveys" ("type", "name", "structure")
         VALUES ('EXPRESS', 'Test Survey', '[]'::jsonb)`
      );

      await migration4.up(queryRunner);

      // Check that version was created
      const versions = await queryRunner.query(
        `SELECT * FROM "survey_versions"`
      );
      expect(versions.length).toBeGreaterThan(0);
      expect(versions[0].version).toBe(1);
      expect(versions[0].status).toBe("PUBLISHED");

      // Check that survey.latest_published_version_id is set
      const surveys = await queryRunner.query(
        `SELECT * FROM "surveys" WHERE "name" = 'Test Survey'`
      );
      expect(surveys[0].latest_published_version_id).toBe(versions[0].id);

      await migration4.down(queryRunner);
      await queryRunner.query(`DELETE FROM "surveys"`);
      await migration3.down(queryRunner);
      await migration2.down(queryRunner);
      await migration1.down(queryRunner);
      await queryRunner.release();
    });
  });

  describe("Migration #5: AddSurveyVersionIdToSessions", () => {
    it("should add survey_version_id column and populate existing sessions", async () => {
      const migration1 = new CreateSurveyVersionsAndAdmins1704672000001();
      const migration2 = new SeedInitialAdmins1704672000002();
      const migration3 = new AddVersioningColumnsToSurveys1704672000003();
      const migration4 = new MigrateExistingSurveysToVersions1704672000004();
      const migration5 = new AddSurveyVersionIdToSessions1704672000005();
      const queryRunner = dataSource.createQueryRunner();

      await migration1.up(queryRunner);
      await migration2.up(queryRunner);
      await migration3.up(queryRunner);

      // Create test survey
      const surveyResult = await queryRunner.query(
        `INSERT INTO "surveys" ("type", "name", "structure")
         VALUES ('EXPRESS', 'Test Survey', '[]'::jsonb)
         RETURNING "id"`
      );
      const surveyId = surveyResult[0].id;

      await migration4.up(queryRunner);

      // Create test session before migration
      const sessionId = "test-session-uuid";
      await queryRunner.query(
        `INSERT INTO "survey_sessions" ("id", "user_telegram_id", "survey_id", "status")
         VALUES ($1, 12345, $2, 'IN_PROGRESS')`,
        [sessionId, surveyId]
      );

      await migration5.up(queryRunner);

      // Check that survey_version_id is populated
      const sessions = await queryRunner.query(
        `SELECT * FROM "survey_sessions" WHERE "id" = $1`,
        [sessionId]
      );
      expect(sessions[0].survey_version_id).toBeDefined();
      expect(sessions[0].survey_version_id).not.toBeNull();

      await queryRunner.query(`DELETE FROM "survey_sessions"`);
      await migration5.down(queryRunner);
      await migration4.down(queryRunner);
      await queryRunner.query(`DELETE FROM "surveys"`);
      await migration3.down(queryRunner);
      await migration2.down(queryRunner);
      await migration1.down(queryRunner);
      await queryRunner.release();
    });
  });

  describe("Data Integrity", () => {
    it("should preserve data integrity across all migrations", async () => {
      const migration1 = new CreateSurveyVersionsAndAdmins1704672000001();
      const migration2 = new SeedInitialAdmins1704672000002();
      const migration3 = new AddVersioningColumnsToSurveys1704672000003();
      const migration4 = new MigrateExistingSurveysToVersions1704672000004();
      const migration5 = new AddSurveyVersionIdToSessions1704672000005();
      const queryRunner = dataSource.createQueryRunner();

      // Run all migrations in order
      await migration1.up(queryRunner);
      await migration2.up(queryRunner);
      await migration3.up(queryRunner);

      // Create test data
      const surveyResult = await queryRunner.query(
        `INSERT INTO "surveys" ("type", "name", "structure")
         VALUES ('EXPRESS', 'Integrity Test', '[{"id": "cat1"}]'::jsonb)
         RETURNING "id"`
      );
      const surveyId = surveyResult[0].id;

      await migration4.up(queryRunner);
      await migration5.up(queryRunner);

      // Verify data integrity
      const surveys = await queryRunner.query(
        `SELECT * FROM "surveys" WHERE "id" = $1`,
        [surveyId]
      );
      expect(surveys.length).toBe(1);
      expect(surveys[0].latest_published_version_id).toBeDefined();

      const versions = await queryRunner.query(
        `SELECT * FROM "survey_versions" WHERE "survey_id" = $1`,
        [surveyId]
      );
      expect(versions.length).toBe(1);
      expect(versions[0].structure).toEqual([{ id: "cat1" }]);

      // Cleanup
      await migration5.down(queryRunner);
      await migration4.down(queryRunner);
      await queryRunner.query(`DELETE FROM "surveys"`);
      await migration3.down(queryRunner);
      await migration2.down(queryRunner);
      await migration1.down(queryRunner);
      await queryRunner.release();
    });
  });
});
