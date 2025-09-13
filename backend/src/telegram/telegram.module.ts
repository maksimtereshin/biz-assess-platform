import { Module } from "@nestjs/common";
import { TelegramController } from "./telegram.controller";
import { TelegramService } from "./telegram.service";
import { AuthModule } from "../auth/auth.module";
import { SurveyModule } from "../survey/survey.module";
import { PaymentModule } from "../payment/payment.module";

@Module({
  imports: [AuthModule, SurveyModule, PaymentModule],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
