import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation pipes globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Set global API prefix
  app.setGlobalPrefix("api");

  // Enable CORS for frontend communication with security
  const frontendUrls = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ["http://localhost:3000"];

  // Additional allowed origins for production scenarios
  const productionOrigins = [
    process.env.PRODUCTION_DOMAIN && `https://${process.env.PRODUCTION_DOMAIN}`,
    process.env.PRODUCTION_DOMAIN && `http://${process.env.PRODUCTION_DOMAIN}`,
    process.env.STAGING_DOMAIN && `https://${process.env.STAGING_DOMAIN}`,
    process.env.STAGING_DOMAIN && `http://${process.env.STAGING_DOMAIN}`,
  ].filter(Boolean);

  const allowedOrigins = [...frontendUrls, ...productionOrigins];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, health checks, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Allow localhost in development
      if (process.env.NODE_ENV === "development" && origin.startsWith("http://localhost")) {
        return callback(null, true);
      }

      // Check against allowed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Log blocked origins for debugging (but don't log health checks)
      if (!origin.includes("localhost") || process.env.DEBUG_CORS === "true") {
        Logger.warn(`CORS blocked origin: ${origin}`, "CORS");
      }

      return callback(new Error("Not allowed by CORS policy"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Telegram-Bot-Api-Secret-Token",
      "X-Requested-With",
      "Accept",
      "Cache-Control",
    ],
    maxAge: 86400, // 24 hours
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, "0.0.0.0");

  Logger.log(`🚀 Backend server running on port ${port}`, "Bootstrap");
}

bootstrap();
