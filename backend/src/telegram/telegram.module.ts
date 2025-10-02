import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TelegramController } from "./telegram.controller";
import { TelegramService } from "./telegram.service";
import { AuthModule } from "../auth/auth.module";
import { SurveyModule } from "../survey/survey.module";
import { PaymentModule } from "../payment/payment.module";
import { User } from "../entities";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthModule,
    SurveyModule,
    PaymentModule,
  ],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
