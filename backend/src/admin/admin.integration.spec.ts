import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminModule } from "./admin.module";
import { AdminService } from "./admin.service";
import { Admin } from "../entities/admin.entity";
import { Survey } from "../entities/survey.entity";
import { SurveyVersion } from "../entities/survey-version.entity";
import { SurveySession } from "../entities/survey-session.entity";

describe("AdminJS Integration (Integration)", () => {
  let app: INestApplication;
  let adminService: AdminService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "postgres",
          host: process.env.DB_HOST || "localhost",
          port: parseInt(process.env.DB_PORT) || 5432,
          username: process.env.DB_USERNAME || "postgres",
          password: process.env.DB_PASSWORD || "password",
          database: process.env.DB_NAME_TEST || "bizass_platform_test",
          entities: [Admin, Survey, SurveyVersion, SurveySession],
          synchronize: false,
          logging: false,
        }),
        AdminModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    adminService = moduleFixture.get<AdminService>(AdminService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("AdminService", () => {
    it("should be defined", () => {
      expect(adminService).toBeDefined();
    });

    it("should validate admin correctly", async () => {
      // Assuming maksim_tereshin exists from seed data
      const isAdmin = await adminService.isAdmin("maksim_tereshin");
      expect(isAdmin).toBe(true);
    });

    it("should return false for non-admin user", async () => {
      const isAdmin = await adminService.isAdmin("non_existent_user");
      expect(isAdmin).toBe(false);
    });

    it("should create and delete admin", async () => {
      // Get an existing admin to use as creator
      const creator = await adminService.findByUsername("maksim_tereshin");
      expect(creator).toBeDefined();

      // Create new admin
      const newAdmin = await adminService.createAdmin("test_admin_user", creator.id);
      expect(newAdmin).toBeDefined();
      expect(newAdmin.telegram_username).toBe("test_admin_user");

      // Verify admin was created
      const isAdmin = await adminService.isAdmin("test_admin_user");
      expect(isAdmin).toBe(true);

      // Delete admin
      await adminService.deleteAdmin(newAdmin.id);

      // Verify admin was deleted
      const isStillAdmin = await adminService.isAdmin("test_admin_user");
      expect(isStillAdmin).toBe(false);
    });
  });
});
