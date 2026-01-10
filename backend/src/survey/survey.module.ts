import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { SurveyController } from "./survey.controller";
import { SurveyService } from "./survey.service";
import { SurveyVersionService } from "./survey-version.service";
import { ValidatorService } from "./validator.service";
import { Survey, SurveySession, Answer, User } from "../entities";
import { SurveyVersion } from "../entities/survey-version.entity";
import { AuthModule } from "../auth/auth.module";
import { ReportDataService } from "../report/report-data.service";
import { AnalyticsCalculator } from "../common/utils/analytics-calculator.util";

@Module({
  imports: [
    TypeOrmModule.forFeature([Survey, SurveySession, SurveyVersion, Answer, User]),
    forwardRef(() => AuthModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SurveyController],
  providers: [SurveyService, SurveyVersionService, ValidatorService, ReportDataService, AnalyticsCalculator],
  exports: [SurveyService, SurveyVersionService],
})
export class SurveyModule {}
