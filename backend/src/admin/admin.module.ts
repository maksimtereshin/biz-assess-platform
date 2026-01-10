import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Survey } from "../entities/survey.entity";
import { SurveyVersion } from "../entities/survey-version.entity";
import { Admin } from "../entities/admin.entity";
import { SurveySession } from "../entities/survey-session.entity";
import { AdminService } from "./admin.service";

/**
 * AdminModule - Simple module for Admin-related services
 *
 * AdminJS integration is handled via @adminjs/express in main.ts setupAdminJS()
 * This approach is recommended by AdminJS docs due to ESM/CommonJS compatibility issues
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Survey, SurveyVersion, Admin, SurveySession]),
  ],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
