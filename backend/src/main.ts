import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { AppModule } from "./app.module";
import * as path from "path";
import { AdminService } from "./admin/admin.service";
import { SurveyVersionService } from "./survey/survey-version.service";
import { createPasswordAuthProvider } from "./admin/providers/telegram-auth.provider";
import * as session from "express-session";

async function setupAdminJS(app: any) {
  try {
    // Load ALL AdminJS modules from centralized loader
    // This ensures we use the SAME module instance throughout
    const { getAdminJSModules } = await import("./admin/admin-adapter");
    const { AdminJS, AdminJSExpress, ComponentLoader, DefaultAuthProvider } =
      await getAdminJSModules();

    // Get AdminService for authentication
    const adminService = app.get(AdminService);

    // Get SurveyVersionService for custom actions
    const surveyVersionService = app.get(SurveyVersionService);

    // Import entities dynamically
    const { Survey } = await import("./entities/survey.entity");
    const { SurveyVersion } = await import("./entities/survey-version.entity");
    const { Admin } = await import("./entities/admin.entity");
    const { SurveySession } = await import("./entities/survey-session.entity");

    // Import resource configurations
    const { AdminResourceOptions } =
      await import("./admin/resources/admin.resource");
    const { SurveyResourceOptions } =
      await import("./admin/resources/survey.resource");
    const { SurveyVersionResourceOptions } =
      await import("./admin/resources/survey-version.resource");
    const { SurveySessionResourceOptions } =
      await import("./admin/resources/survey-session.resource");

    // Initialize ComponentLoader for custom React components
    const componentLoader = new ComponentLoader();

    // Register custom components using ComponentLoader
    // AdminJS v7 requires direct paths to .tsx files (not .bundle.tsx)
    // ComponentLoader handles bundling automatically when admin.watch() is called
    const isDev = process.env.NODE_ENV !== "production";

    // Component paths must point to SOURCE .tsx files (not dist/)
    // AdminJS ComponentLoader needs .tsx files to bundle at runtime
    // Dynamically determine path based on where main.js is located:
    // - Development/local: __dirname = /app/dist/src → ../../src/admin/components
    // - Production Docker: __dirname = /app/dist → ../src/admin/components
    const isInSrcSubdir = __dirname.endsWith(path.sep + "src");
    const componentsPath = path.join(
      __dirname,
      isInSrcSubdir ? "../../src/admin/components" : "../src/admin/components",
    );

    const Components = {
      StructureEditor: componentLoader.add(
        "StructureEditor",
        path.join(componentsPath, "StructureEditor"),
      ),
      SurveyPreview: componentLoader.add(
        "SurveyPreview",
        path.join(componentsPath, "SurveyPreview"),
      ),
      // TelegramLogin removed - using default AdminJS login page
    };

    console.log(
      "[DEBUG] Registered custom components:",
      Object.keys(Components).join(", "),
    );
    console.log("[DEBUG] Component paths resolved (dev mode:", isDev + ")");

    // Create AdminJS instance with explicit resources
    console.log("[DEBUG] Creating AdminJS instance with explicit resources...");
    console.log(
      "[DEBUG] Resources configured: Admin, Survey, SurveyVersion, SurveySession",
    );

    const admin = new AdminJS({
      rootPath: "/admin",
      resources: [
        {
          resource: Admin,
          options: AdminResourceOptions,
        },
        {
          resource: Survey,
          options: SurveyResourceOptions,
        },
        {
          resource: SurveyVersion,
          options: SurveyVersionResourceOptions,
        },
        {
          resource: SurveySession,
          options: SurveySessionResourceOptions,
        },
      ],
      branding: {
        companyName: "BizAssess Admin Panel",
        logo: false,
      },
      componentLoader,
      // Use default AdminJS login page (username + password)
      // No custom pages needed for password authentication
      locale: {
        language: "ru",
        translations: {
          labels: {
            navigation: "Навигация",
            pages: "Страницы",
            selectedRecords: "Выбрано записей: {{selected}}",
            filters: "Фильтры",
            adminVersion: "Версия Admin",
            appVersion: "Версия приложения",
            loginWelcome: "Добро пожаловать в админ-панель BizAssess",
          },
          actions: {
            new: "Создать",
            edit: "Редактировать",
            show: "Просмотр",
            delete: "Удалить",
            bulkDelete: "Удалить выбранные",
            list: "Список",
            save: "Сохранить",
            cancel: "Отмена",
            filter: "Фильтр",
            resetFilter: "Сбросить фильтр",
            createNewVersion: "Создать новую версию",
            publishVersion: "Опубликовать версию",
            unpublishVersion: "Снять с публикации",
          },
          messages: {
            successfullyCreated: "Запись успешно создана",
            successfullyUpdated: "Запись успешно обновлена",
            successfullyDeleted: "Запись успешно удалена",
            thereWereValidationErrors: "Обнаружены ошибки валидации",
            forbiddenError: "У вас нет прав для выполнения этого действия",
            resourceNotFound: "Ресурс не найден",
          },
          properties: {
            length: "Длина",
            from: "От",
            to: "До",
          },
        },
      },
    });

    // Attach services to AdminJS instance for custom actions
    // Store on admin instance directly (not in env) to avoid JSON serialization issues
    (admin as any).surveyVersionService = surveyVersionService;

    // Enable watch mode for component bundling in development
    // NOTE: admin.watch() causes "Converting circular structure to JSON" error
    // with TypeORM entities in AdminJS v7. This is a known issue.
    // Workaround: Use AdminJS without watch mode and rely on ComponentLoader
    // to handle bundling when components are first accessed.
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[DEBUG] AdminJS watch mode skipped (TypeORM circular structure issue)",
      );
      console.log("[DEBUG] Components will be bundled on-demand");
    }

    // Create password-based authentication provider
    // Admin users login with username and password (no Telegram dependency)
    const authProvider = createPasswordAuthProvider(
      DefaultAuthProvider,
      componentLoader,
      adminService,
    );

    // AdminJS will use default login page with username/password fields

    // Session secret for AdminJS
    const sessionSecret =
      process.env.ADMIN_SESSION_SECRET || "complex-secret-change-in-production";

    // Configure PostgreSQL session store
    const connectPgSimple = require("connect-pg-simple");
    const PgSession = connectPgSimple(session);

    const sessionStore = new PgSession({
      conObject: {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT) || 5432,
        user: process.env.DB_USERNAME || "postgres",
        password: process.env.DB_PASSWORD || "password",
        database: process.env.DB_NAME || "bizass_platform",
      },
      tableName: "session",
      createTableIfMissing: true, // Auto-create table on first run
      ttl: 7 * 24 * 60 * 60, // 7 days
      pruneSessionInterval: 60 * 60, // Cleanup expired sessions hourly
    });

    // Build AdminJS router with PostgreSQL session store
    // @ts-ignore
    const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
      admin,
      {
        provider: authProvider,
        cookiePassword: sessionSecret,
      },
      null,
      {
        store: sessionStore, // KEY CHANGE: Use PostgreSQL instead of memory
        resave: false,
        saveUninitialized: false,
        secret: sessionSecret,
        cookie: {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax", // Desktop browser access = first-party cookies (no need for 'none')
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        },
      },
    );

    // Mount AdminJS router (authentication handled by simple auth provider)
    app.use(admin.options.rootPath, adminRouter);

    const logger = new Logger("AdminJS");
    logger.log(`AdminJS is running at ${admin.options.rootPath}`);
    // logger.log(
    //   `Custom components registered: ${Object.keys(Components).length}`,
    // );
  } catch (error) {
    const logger = new Logger("AdminJS");
    logger.error("Failed to setup AdminJS:", error);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("Bootstrap");

  // Set global API prefix (all routes will be prefixed with /api)
  // Exclude frontend proxy routes (/, /express/*, /full/*)
  app.setGlobalPrefix("api", {
    exclude: ["/", "express", "express/(.*)", "full", "full/(.*)"],
  });

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Setup AdminJS (must be done after app creation)
  // Using @adminjs/express approach (recommended by AdminJS docs for NestJS/CommonJS projects)
  await setupAdminJS(app);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`AdminJS available at: http://localhost:${port}/admin`);
}

bootstrap();
