import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReportService } from "./report.service";
import { ReportController } from "./report.controller";
import { ReportDataService } from "./report-data.service";
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
  providers: [ReportService, ReportDataService, AnalyticsCalculator, PdfGenerator],
  exports: [ReportService, ReportDataService],
})
export class ReportModule {}
