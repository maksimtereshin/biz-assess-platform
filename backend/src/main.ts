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

    // Middleware to validate Authorization header for admin requests
    // Replaces session-based authentication with JWT token validation
    const adminAuthMiddleware = async (req: any, res: any, next: any) => {
      try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          // If no Authorization header, return HTML that retrieves token from SecureStorage
          // and injects it into all fetch requests
          return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>BizAssess Admin Panel</title>
              <script src="https://telegram.org/js/telegram-web-app.js"></script>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  background-color: #f5f5f5;
                }
                .loader { text-align: center; }
                .spinner {
                  border: 4px solid #f3f3f3;
                  border-top: 4px solid #3498db;
                  border-radius: 50%;
                  width: 40px;
                  height: 40px;
                  animation: spin 1s linear infinite;
                  margin: 0 auto 20px;
                }
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                .error {
                  color: #d32f2f;
                  padding: 20px;
                  text-align: center;
                }
              </style>
              <script>
                // Check if Telegram WebApp is available
                if (typeof Telegram === 'undefined' || !Telegram.WebApp || !Telegram.WebApp.SecureStorage) {
                  document.body.innerHTML = '<div class="error"><h1>Ошибка</h1><p>Telegram WebApp недоступен. Пожалуйста, откройте админ-панель через Telegram бот.</p></div>';
                } else {
                  // Retrieve admin token from Telegram SecureStorage
                  Telegram.WebApp.SecureStorage.getItem('admin_token', function(error, token) {
                    if (error || !token) {
                      console.error('No admin token found in SecureStorage:', error);
                      document.body.innerHTML = '<div class="error"><h1>Требуется авторизация</h1><p>Токен доступа не найден. Пожалуйста, войдите через Telegram бот заново.</p></div>';
                      return;
                    }

                    console.log('[ADMIN AUTH] Token retrieved from SecureStorage');

                    // Override fetch to inject Authorization header into ALL requests
                    const originalFetch = window.fetch;
                    window.fetch = function(input, init) {
                      init = init || {};
                      init.headers = init.headers || {};

                      // Add Authorization header with token from SecureStorage
                      if (init.headers instanceof Headers) {
                        init.headers.set('Authorization', 'Bearer ' + token);
                      } else if (Array.isArray(init.headers)) {
                        init.headers.push(['Authorization', 'Bearer ' + token]);
                      } else {
                        init.headers['Authorization'] = 'Bearer ' + token;
                      }

                      console.log('[ADMIN AUTH] Injecting Authorization header into fetch request');
                      return originalFetch(input, init);
                    };

                    // Fetch AdminJS HTML with Authorization header and replace page content
                    console.log('[ADMIN AUTH] Loading AdminJS with Authorization header');
                    fetch(window.location.href, {
                      headers: {
                        'Authorization': 'Bearer ' + token
                      }
                    })
                    .then(response => response.text())
                    .then(html => {
                      // Replace entire document with AdminJS HTML
                      document.open();
                      document.write(html);
                      document.close();
                    })
                    .catch(error => {
                      console.error('[ADMIN AUTH] Failed to load AdminJS:', error);
                      document.body.innerHTML = '<div class="error"><h1>Ошибка загрузки</h1><p>Не удалось загрузить админ-панель. Пожалуйста, попробуйте снова.</p></div>';
                    });
                  });
                }
              </script>
            </head>
            <body>
              <div class="loader">
                <div class="spinner"></div>
                <p>Загрузка админ-панели...</p>
              </div>
            </body>
            </html>
          `);
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Validate JWT token signature and expiration
        const payload = authService.validateAdminToken(token);
        const normalizedUsername = payload.username?.trim().toLowerCase();

        // Verify user is still an admin (in case they were removed)
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

        // Get full admin details from database
        const adminUser = await adminService.findByUsername(normalizedUsername);

        if (!adminUser) {
          return res.status(401).send("Admin user not found");
        }

        logger.log(
          `[ADMIN AUTH] Token validated for admin: "${normalizedUsername}"`,
        );

        // Attach admin to request object for AdminJS
        (req as any).adminUser = {
          id: adminUser.id,
          username: adminUser.telegram_username,
          email: `${adminUser.telegram_username}@telegram.user`,
        };

        next();
      } catch (error) {
        logger.error("[ADMIN AUTH] Token validation error:", error);
        return res.status(401).send(`
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
        logger.log(`[ADMIN AUTH] Storing token in Telegram SecureStorage`);

        // Return HTML page that stores token in Telegram SecureStorage
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Loading Admin Panel...</title>
            <script src="https://telegram.org/js/telegram-web-app.js"></script>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background-color: #f5f5f5;
              }
              .loader { text-align: center; }
              .spinner {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
            <script>
              const token = "${token}";

              // Check if Telegram WebApp is available
              if (typeof Telegram === 'undefined' || !Telegram.WebApp || !Telegram.WebApp.SecureStorage) {
                console.error('Telegram WebApp not available');
                alert('Failed to access Telegram WebApp. Please open this page from Telegram bot.');
              } else {
                // Store token in Telegram SecureStorage
                Telegram.WebApp.SecureStorage.setItem('admin_token', token, function(error) {
                  if (error) {
                    console.error('Failed to store token:', error);
                    alert('Failed to save authentication. Please try again.');
                    return;
                  }

                  console.log('Token stored successfully in SecureStorage');

                  // Remove token from URL and reload page
                  window.history.replaceState({}, document.title, '/admin');
                  window.location.reload();
                });
              }
            </script>
          </head>
          <body>
            <div class="loader">
              <div class="spinner"></div>
              <p>Authenticating...</p>
            </div>
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

    // AdminJS authentication provider
    const authenticate = async () => {
      // We don't use email/password authentication
      // Authentication is handled by adminTokenHandler via Telegram SecureStorage tokens
      return null;
    };

    // Provide authenticated admin user to AdminJS context
    // Now reads from req.adminUser (set by adminAuthMiddleware) instead of session
    const getCurrentAdmin = async (req: any) => {
      if (req.adminUser) {
        return req.adminUser;
      }
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
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        },
      },
      getCurrentAdmin,
    );

    // Apply token handler first (for initial authentication with ?token= query param)
    app.use("/admin", adminTokenHandler);

    // Apply auth middleware (validates Authorization header for all subsequent requests)
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
