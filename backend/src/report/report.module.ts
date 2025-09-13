import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReportService } from "./report.service";
import { ReportController } from "./report.controller";
import { AnalyticsCalculator } from "../common/utils/analytics-calculator.util";
import { PdfGenerator } from "../common/utils/pdf-generator.util";
import { Report, SurveySession, Answer } from "../entities";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, SurveySession, Answer]),
    AuthModule,
  ],
  controllers: [ReportController],
  providers: [ReportService, AnalyticsCalculator, PdfGenerator],
  exports: [ReportService],
})
export class ReportModule {}
