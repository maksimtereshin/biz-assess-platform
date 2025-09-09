import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyModule } from './survey/survey.module';
import { PaymentModule } from './payment/payment.module';
import { ReportModule } from './report/report.module';
import { TelegramModule } from './telegram/telegram.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { ProxyModule } from './proxy/proxy.module';
import * as entities from './entities';
import { DataSource } from 'typeorm';
import { seedSurveys } from './data/seed-surveys';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Database module
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'bizass_platform',
      entities: Object.values(entities),
      synchronize: process.env.NODE_ENV !== 'production' || process.env.DB_SYNC === 'true', // Allow sync in production if explicitly enabled
      logging: process.env.NODE_ENV === 'development',
    }),
    
    // Feature modules
    SurveyModule,
    PaymentModule,
    ReportModule,
    TelegramModule,
    AuthModule,
    HealthModule,
    ProxyModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    // Seed initial data
    await seedSurveys(this.dataSource);
  }
}
