import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { SurveyController } from "./survey.controller";
import { SurveyService } from "./survey.service";
import { Survey, SurveySession, Answer, User } from "../entities";
import { AuthModule } from "../auth/auth.module";
import { ReportDataService } from "../report/report-data.service";
import { AnalyticsCalculator } from "../common/utils/analytics-calculator.util";

@Module({
  imports: [
    TypeOrmModule.forFeature([Survey, SurveySession, Answer, User]),
    forwardRef(() => AuthModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SurveyController],
  providers: [SurveyService, ReportDataService, AnalyticsCalculator],
  exports: [SurveyService],
})
export class SurveyModule {}
