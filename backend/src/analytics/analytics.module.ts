import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { User } from '../entities/user.entity';
import { SurveySession } from '../entities/survey-session.entity';
import { Payment } from '../entities/payment.entity';
import { Answer } from '../entities/answer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, SurveySession, Payment, Answer]),
  ],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
