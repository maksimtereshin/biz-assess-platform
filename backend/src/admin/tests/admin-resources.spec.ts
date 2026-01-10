import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { Admin } from "../../entities/admin.entity";
import { Survey } from "../../entities/survey.entity";
import { SurveyVersion, SurveyVersionStatus } from "../../entities/survey-version.entity";
import { SurveySession } from "../../entities/survey-session.entity";
import { AdminService } from "../admin.service";

/**
 * Tests for AdminJS resources configuration
 *
 * Focus: Critical CRUD operations for AdminJS resources
 *
 * Tests verify:
 * 1. Admin resource CRUD operations
 * 2. Survey resource soft delete
 * 3. SurveyVersion resource filtering by status
 * 4. Data integrity after operations
 */
describe("AdminJS Resources", () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let adminService: AdminService;
  let testAdmin: Admin;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "postgres",
          host: process.env.DB_HOST || "localhost",
          port: parseInt(process.env.DB_PORT || "5432"),
          username: process.env.DB_USER || "postgres",
          password: process.env.DB_PASSWORD || "postgres",
          database: process.env.DB_NAME || "bizass_platform_test",
          entities: [Admin, Survey, SurveyVersion, SurveySession],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([Admin, Survey, SurveyVersion, SurveySession]),
      ],
      providers: [AdminService],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
    adminService = module.get<AdminService>(AdminService);

    // Create initial admin for tests
    const adminRepo = dataSource.getRepository(Admin);
    testAdmin = await adminRepo.save({
      telegram_username: "test_admin",
      created_by: null,
    });
  }, 30000); // Increased timeout for DB setup

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    if (module) {
      await module.close();
    }
  }, 10000);

  describe("Admin Resource", () => {
    it("should create a new admin with created_by reference", async () => {
      const newAdmin = await adminService.createAdmin("new_admin_user", testAdmin.id);

      expect(newAdmin).toBeDefined();
      expect(newAdmin.telegram_username).toBe("new_admin_user");
      expect(newAdmin.created_by_id).toBe(testAdmin.id);
    });

    it("should prevent deletion of the last admin", async () => {
      // Get all admins and delete all but one
      const allAdmins = await adminService.getAdminHistory();

      for (let i = 1; i < allAdmins.length; i++) {
        await adminService.deleteAdmin(allAdmins[i].id);
      }

      // Try to delete the last admin - should fail
      await expect(
        adminService.deleteAdmin(allAdmins[0].id)
      ).rejects.toThrow("Cannot delete the last administrator");
    });
  });

  describe("Survey Resource", () => {
    it("should create survey and support soft delete", async () => {
      const surveyRepo = dataSource.getRepository(Survey);
      const survey = await surveyRepo.save({
        name: "Test Survey",
        type: "EXPRESS",
      });

      expect(survey).toBeDefined();
      expect(survey.deleted_at).toBeNull();

      // Soft delete
      survey.deleted_at = new Date();
      await surveyRepo.save(survey);

      const deletedSurvey = await surveyRepo.findOne({ where: { id: survey.id } });
      expect(deletedSurvey?.deleted_at).toBeDefined();
    });
  });

  describe("SurveyVersion Resource", () => {
    it("should create version and filter by status", async () => {
      const surveyRepo = dataSource.getRepository(Survey);
      const versionRepo = dataSource.getRepository(SurveyVersion);

      const survey = await surveyRepo.save({
        name: "Version Test Survey",
        type: "EXPRESS",
      });

      // Create DRAFT version
      const draftVersion = await versionRepo.save(
        versionRepo.create({
          survey_id: survey.id,
          version: 1,
          name: "Draft Version",
          type: "EXPRESS",
          structure: [],
          status: SurveyVersionStatus.DRAFT,
          created_by_id: testAdmin.id,
        })
      );

      // Create PUBLISHED version
      const publishedVersion = await versionRepo.save(
        versionRepo.create({
          survey_id: survey.id,
          version: 2,
          name: "Published Version",
          type: "EXPRESS",
          structure: [],
          status: SurveyVersionStatus.PUBLISHED,
          published_at: new Date(),
          created_by_id: testAdmin.id,
        })
      );

      expect(draftVersion.status).toBe(SurveyVersionStatus.DRAFT);
      expect(publishedVersion.status).toBe(SurveyVersionStatus.PUBLISHED);

      // Test filtering
      const drafts = await versionRepo.find({
        where: { survey_id: survey.id, status: SurveyVersionStatus.DRAFT },
      });
      expect(drafts.length).toBe(1);
    });

    it("should update Survey.latest_published_version_id", async () => {
      const surveyRepo = dataSource.getRepository(Survey);
      const versionRepo = dataSource.getRepository(SurveyVersion);

      const survey = await surveyRepo.save({
        name: "Publish Test Survey",
        type: "FULL",
      });

      const version = await versionRepo.save(
        versionRepo.create({
          survey_id: survey.id,
          version: 1,
          name: "Published Version",
          type: "FULL",
          structure: [],
          status: SurveyVersionStatus.PUBLISHED,
          published_at: new Date(),
          created_by_id: testAdmin.id,
        })
      );

      // Update survey to reference this version
      survey.latest_published_version_id = version.id;
      await surveyRepo.save(survey);

      const updatedSurvey = await surveyRepo.findOne({ where: { id: survey.id } });
      expect(updatedSurvey?.latest_published_version_id).toBe(version.id);
    });
  });

  describe("SurveySession Resource (Read-only)", () => {
    it("should create session with survey_version_id reference", async () => {
      const surveyRepo = dataSource.getRepository(Survey);
      const versionRepo = dataSource.getRepository(SurveyVersion);
      const sessionRepo = dataSource.getRepository(SurveySession);

      const survey = await surveyRepo.save({
        name: "Session Test Survey",
        type: "EXPRESS",
      });

      const version = await versionRepo.save(
        versionRepo.create({
          survey_id: survey.id,
          version: 1,
          name: "Session Test Version",
          type: "EXPRESS",
          structure: [],
          status: SurveyVersionStatus.PUBLISHED,
          created_by_id: testAdmin.id,
        })
      );

      const session = await sessionRepo.save({
        survey_id: survey.id,
        survey_version_id: version.id,
        user_id: 1,
        session_token: "test_token_12345",
        status: "IN_PROGRESS",
      });

      expect(session.survey_version_id).toBe(version.id);
      expect(session.status).toBe("IN_PROGRESS");
    });
  });
});
