import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { AppModule } from "./app.module";
import session from "express-session";
import * as path from "path";
import { AuthService } from "./auth/auth.service";
import { AdminService } from "./admin/admin.service";
import { SurveyVersionService } from "./survey/survey-version.service";

async function setupAdminJS(app: any) {
  try {
    // Load ALL AdminJS modules from centralized loader
    // This ensures we use the SAME module instance throughout
    const { getAdminJSModules } = await import("./admin/admin-adapter");
    const { AdminJS, AdminJSExpress, ComponentLoader } =
      await getAdminJSModules();

    // Get DataSource for entity metadata
    const { DataSource: TypeOrmDataSource } = await import("typeorm");
    const dataSource = app.get(TypeOrmDataSource);

    // Get AuthService and AdminService for authentication
    const authService = app.get(AuthService);
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

    // Configure session middleware for AdminJS
    const sessionMiddleware = session({
      secret:
        process.env.ADMIN_SESSION_SECRET ||
        "complex-secret-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Required for Telegram WebApp
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
      },
    });

    // Apply session middleware to all routes
    app.use(sessionMiddleware);

    // Custom authentication middleware for AdminJS
    const adminAuthMiddleware = async (req: any, res: any, next: any) => {
      // Skip authentication for AdminJS assets (CSS, JS, etc.)
      if (
        req.path.includes("/admin/frontend/assets/") ||
        req.path.includes(".css") ||
        req.path.includes(".js")
      ) {
        return next();
      }

      const session = req.session;

      // Check if user already authenticated in session
      if (session?.adminUser) {
        return next();
      }

      // Extract token from query parameter (for first-time login from Telegram bot)
      const token = req.query.token as string;

      if (!token) {
        // No token and no session - forbidden
        return res.status(403).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Доступ запрещен</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              h1 { color: #d32f2f; }
            </style>
          </head>
          <body>
            <h1>Доступ запрещен</h1>
            <p>У вас нет прав для доступа к админ-панели.</p>
            <p>Войдите через кнопку "🔧 Админ панель" в Telegram боте.</p>
          </body>
          </html>
        `);
      }

      try {
        // Validate JWT token
        const payload = authService.validateAdminToken(token);
        logger.log(
          `[ADMIN AUTH] Token validated for username: "${payload.username}"`,
        );

        // Check if user is admin (normalize username for consistency with database)
        const normalizedUsername = payload.username?.trim().toLowerCase();
        logger.log(`[ADMIN AUTH] Normalized username: "${normalizedUsername}"`);

        const isAdmin = await adminService.isAdmin(normalizedUsername);
        logger.log(
          `[ADMIN AUTH] Admin check result for "${normalizedUsername}": ${isAdmin}`,
        );

        if (!isAdmin) {
          logger.warn(`[ADMIN AUTH] Access denied for "${normalizedUsername}"`);
          return res.status(403).send(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>Доступ запрещен</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                h1 { color: #d32f2f; }
              </style>
            </head>
            <body>
              <h1>Доступ запрещен</h1>
              <p>Ваш Telegram username не найден в списке администраторов.</p>
            </body>
            </html>
          `);
        }

        // Get admin details
        const adminUser = await adminService.findByUsername(normalizedUsername);
        logger.log(
          `[ADMIN AUTH] findByUsername result: ${adminUser ? `FOUND (id: ${adminUser.id}, username: ${adminUser.telegram_username})` : "NULL"}`,
        );

        if (!adminUser) {
          logger.error(
            `[ADMIN AUTH] Admin not found for "${normalizedUsername}" despite isAdmin=true`,
          );
          return res.status(403).send("Доступ запрещен");
        }

        // Save admin user to session
        session.adminUser = {
          id: adminUser.id,
          username: adminUser.telegram_username,
          email: `${adminUser.telegram_username}@telegram.user`, // AdminJS expects email
        };

        // CRITICAL FIX: Save session before redirect to prevent race condition
        session.save((err) => {
          if (err) {
            logger.error("[ADMIN AUTH] Failed to save session:", err);
            return res.status(500).send("Internal server error");
          }

          logger.log(
            `[ADMIN AUTH] Session saved successfully for "${normalizedUsername}", redirecting to /admin`,
          );
          return res.redirect("/admin");
        });
      } catch (error) {
        console.error("Admin authentication error:", error);
        return res.status(403).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Ошибка авторизации</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              h1 { color: #d32f2f; }
            </style>
          </head>
          <body>
            <h1>Ошибка авторизации</h1>
            <p>Токен доступа недействителен или истек.</p>
            <p>Пожалуйста, войдите через Telegram бот заново.</p>
          </body>
          </html>
        `);
      }
    };

    // AdminJS authentication provider
    const authenticate = async () => {
      // We don't use email/password authentication
      // Authentication is handled by adminAuthMiddleware via Telegram tokens
      return null;
    };

    // Build AdminJS router with authentication
    // @ts-ignore
    const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
      admin,
      {
        authenticate,
        cookiePassword:
          process.env.ADMIN_SESSION_SECRET ||
          "complex-secret-change-in-production",
      },
      null,
      {
        resave: false,
        saveUninitialized: false,
        secret:
          process.env.ADMIN_SESSION_SECRET ||
          "complex-secret-change-in-production",
        cookie: {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        },
      },
    );

    // Apply custom auth middleware before AdminJS routes
    app.use("/admin", adminAuthMiddleware);

    // Mount AdminJS router
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
