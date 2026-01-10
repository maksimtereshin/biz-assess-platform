import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { AppModule } from "./app.module";
import session from "express-session";
import * as path from "path";
import { AuthService } from "./auth/auth.service";
import { AdminService } from "./admin/admin.service";
import { SurveyVersionService } from "./survey/survey-version.service";
import { createTelegramAuthProvider } from "./admin/providers/telegram-auth.provider";

async function setupAdminJS(app: any) {
  try {
    // Load ALL AdminJS modules from centralized loader
    // This ensures we use the SAME module instance throughout
    const { getAdminJSModules } = await import("./admin/admin-adapter");
    const { AdminJS, AdminJSExpress, ComponentLoader, DefaultAuthProvider } =
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

    // Token handler for initial authentication from Telegram bot
    // Stores JWT token in Telegram SecureStorage instead of session cookies
    const adminTokenHandler = async (req: any, res: any, next: any) => {
      const token = req.query.token as string;

      // If no token in query, continue to AdminJS (will be authenticated via AdminTokenAuthMiddleware)
      if (!token) {
        return next();
      }

      try {
        // Validate token before storing
        const payload = authService.validateAdminToken(token);
        const normalizedUsername = payload.username?.trim().toLowerCase();

        // Verify user is admin
        const isAdmin = await adminService.isAdmin(normalizedUsername);
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

        logger.log(
          `[ADMIN AUTH] Token validated for admin: "${normalizedUsername}"`,
        );
        logger.log(`[ADMIN AUTH] Storing token in SecureStorage and redirecting`);

        // Return HTML page that stores token in SecureStorage and redirects
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Вход в админ-панель</title>
            <script src="https://telegram.org/js/telegram-web-app.js"></script>
            <style>
              body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 50px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .loader {
                border: 4px solid rgba(255,255,255,0.3);
                border-top: 4px solid white;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 20px auto;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <h1>Загрузка админ-панели...</h1>
            <div class="loader"></div>
            <p>Пожалуйста, подождите</p>
            <script>
              console.log('[ADMIN AUTH] Storing token in SecureStorage');

              if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.SecureStorage) {
                window.Telegram.WebApp.SecureStorage.setItem('admin_token', '${token}', function(error) {
                  if (error) {
                    console.error('[ADMIN AUTH] Failed to store token:', error);
                    alert('Ошибка сохранения токена. Попробуйте снова.');
                  } else {
                    console.log('[ADMIN AUTH] Token stored successfully, redirecting to /admin');
                    window.location.href = '/admin';
                  }
                });
              } else {
                console.warn('[ADMIN AUTH] Telegram WebApp not available, redirecting anyway');
                window.location.href = '/admin';
              }
            </script>
          </body>
          </html>
        `);
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

    // Create and initialize TelegramAuthProvider for AdminJS authentication
    // This provider handles authentication via Bearer tokens from Telegram SecureStorage
    // Uses DefaultAuthProvider from centralized admin-adapter (no dynamic import issues)
    const telegramAuthProvider = createTelegramAuthProvider(
      DefaultAuthProvider,
      componentLoader,
      authService,
      adminService,
    );

    // Session secret for AdminJS
    const sessionSecret =
      process.env.ADMIN_SESSION_SECRET || "complex-secret-change-in-production";

    // Build AdminJS router with TelegramAuthProvider
    // @ts-ignore
    const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
      admin,
      {
        provider: telegramAuthProvider,
        cookiePassword: sessionSecret,
      },
      null,
      {
        resave: false,
        saveUninitialized: false,
        secret: sessionSecret,
        cookie: {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        },
      },
    );

    // Apply token handler first (for initial authentication with ?token= query param)
    app.use("/admin", adminTokenHandler);

    // HTML injection middleware - intercepts AdminJS HTML responses and injects Bearer token script
    app.use("/admin", (req: any, res: any, next: any) => {
      // Only intercept HTML responses, not static assets
      if (req.path && (req.path.endsWith('.js') || req.path.endsWith('.css') ||
          req.path.endsWith('.map') || req.path.endsWith('.png') || req.path.endsWith('.svg'))) {
        return next();
      }

      const originalSend = res.send;
      res.send = function (data: any) {
        // Only modify HTML responses
        if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
          // Inject script into <head> BEFORE any other scripts
          const scriptToInject = `
            <script src="https://telegram.org/js/telegram-web-app.js"></script>
            <script>
              console.log('[ADMIN AUTH] Initializing Telegram SecureStorage fetch override');

              // Get token from SecureStorage
              if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.SecureStorage) {
                window.Telegram.WebApp.SecureStorage.getItem('admin_token', function(error, token) {
                  if (error) {
                    console.error('[ADMIN AUTH] Failed to get token from SecureStorage:', error);
                    return;
                  }

                  if (token) {
                    console.log('[ADMIN AUTH] Token retrieved from SecureStorage, overriding fetch');

                    // Override fetch to add Authorization header
                    const originalFetch = window.fetch;
                    window.fetch = function(input, init) {
                      // Add Authorization header to all requests
                      init = init || {};
                      init.headers = init.headers || {};
                      if (typeof init.headers === 'object' && !Array.isArray(init.headers)) {
                        init.headers['Authorization'] = 'Bearer ' + token;
                      }

                      console.log('[ADMIN AUTH] Fetch request with Bearer token:', typeof input === 'string' ? input : input.url);
                      return originalFetch(input, init);
                    };

                    console.log('[ADMIN AUTH] Fetch override installed successfully');
                  } else {
                    console.warn('[ADMIN AUTH] No token found in SecureStorage');
                  }
                });
              } else {
                console.warn('[ADMIN AUTH] Telegram WebApp API not available');
              }
            </script>
          `;

          // Inject right after <head> tag
          data = data.replace('<head>', '<head>' + scriptToInject);
        }

        return originalSend.call(this, data);
      };

      next();
    });

    // Mount AdminJS router (authentication handled by TelegramAuthProvider)
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
