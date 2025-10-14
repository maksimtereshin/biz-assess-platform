import { Module, OnModuleInit } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { SurveyModule } from "./survey/survey.module";
import { PaymentModule } from "./payment/payment.module";
import { ReportModule } from "./report/report.module";
import { TelegramModule } from "./telegram/telegram.module";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { ProxyModule } from "./proxy/proxy.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { ExcelModule } from "./excel/excel.module";
import { CommonModule } from "./common/common.module";
import * as entities from "./entities";
import { DataSource } from "typeorm";
import { seedSurveys } from "./data/seed-surveys";
import { MigrationRunnerService } from "./common/services/migration-runner.service";

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    // Rate limiting module
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: "medium",
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: "long",
        ttl: 900000, // 15 minutes
        limit: 1000, // 1000 requests per 15 minutes
      },
    ]),

    // Database module
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || "postgres",
      password: process.env.DB_PASSWORD || "password",
      database: process.env.DB_NAME || "bizass_platform",
      entities: Object.values(entities),
      synchronize: process.env.NODE_ENV === "development", // Never synchronize in production
      logging: process.env.NODE_ENV === "development",
    }),

    // Common module (global utilities)
    CommonModule,

    // Feature modules
    SurveyModule,
    PaymentModule,
    ReportModule,
    TelegramModule,
    AuthModule,
    HealthModule,
    ProxyModule,
    AnalyticsModule,
    ExcelModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    MigrationRunnerService,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    // Seed initial data
    await seedSurveys(this.dataSource);
  }
}
