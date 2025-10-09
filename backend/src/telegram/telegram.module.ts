import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TelegramController } from "./telegram.controller";
import { TelegramService } from "./telegram.service";
import { CalendarService } from "./calendar/calendar.service";
import { AuthModule } from "../auth/auth.module";
import { SurveyModule } from "../survey/survey.module";
import { PaymentModule } from "../payment/payment.module";
import { AnalyticsModule } from "../analytics/analytics.module";
import { ExcelModule } from "../excel/excel.module";
import { User } from "../entities";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthModule,
    SurveyModule,
    PaymentModule,
    AnalyticsModule,
    ExcelModule,
  ],
  controllers: [TelegramController],
  providers: [TelegramService, CalendarService],
  exports: [TelegramService],
})
export class TelegramModule {}
