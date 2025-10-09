import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThanOrEqual, Not, IsNull } from 'typeorm';
import { User } from '../entities/user.entity';
import { SurveySession } from '../entities/survey-session.entity';
import { Payment } from '../entities/payment.entity';
import { Answer } from '../entities/answer.entity';
import { UserEngagement } from './dto/analytics.dto';
import { PaymentStatusEnum, SurveySessionStatus, CACHE_TTL } from './analytics.constants';

@Injectable()
export class AnalyticsService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTTL = CACHE_TTL;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SurveySession)
    private readonly sessionRepository: Repository<SurveySession>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
  ) {}

  // ==================== User Statistics ====================

  /**
   * Get total count of all registered users
   */
  async getTotalUsers(): Promise<number> {
    const cacheKey = 'total_users';
    const cached = this.getFromCache<number>(cacheKey);
    if (cached !== null) return cached;

    const count = await this.userRepository.count();
    this.setCache(cacheKey, count);
    return count;
  }

  /**
   * Get count of users registered within a date range
   */
  async getNewUsers(
    startDate: Date | null,
    endDate: Date | null,
  ): Promise<number> {
    if (!startDate || !endDate) {
      return await this.userRepository.count();
    }

    return await this.userRepository.count({
      where: {
        created_at: Between(startDate, endDate),
      },
    });
  }

  /**
   * Calculate user growth rate as percentage
   * Returns: (new users in period) / users before start * 100
   */
  async getUserGrowthRate(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const usersBefore = await this.userRepository.count({
      where: {
        created_at: LessThan(startDate),
      },
    });

    if (usersBefore === 0) return 0;

    const newUsersInPeriod = await this.userRepository.count({
      where: {
        created_at: Between(startDate, endDate),
      },
    });

    const growthRate = (newUsersInPeriod / usersBefore) * 100;

    return Math.round(growthRate * 100) / 100; // Round to 2 decimal places
  }

  // ==================== Survey Metrics ====================

  /**
   * Get survey statistics for a specific type and date range
   */
  async getSurveyStats(
    type: string,
    startDate: Date | null,
    endDate: Date | null,
  ): Promise<{ started: number; completed: number }> {
    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.survey', 'survey')
      .where('survey.type = :type', { type });

    if (startDate && endDate) {
      queryBuilder.andWhere('session.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const started = await queryBuilder.getCount();

    const completedQuery = queryBuilder.clone();
    const completed = await completedQuery
      .andWhere('session.status = :status', { status: SurveySessionStatus.COMPLETED })
      .getCount();

    return { started, completed };
  }

  /**
   * Calculate conversion rate (completion percentage) for a survey type
   */
  async getConversionRate(
    type: string,
    startDate: Date | null,
    endDate: Date | null,
  ): Promise<number> {
    const whereClause: any = {
      survey: { type },
    };

    if (startDate && endDate) {
      whereClause.created_at = Between(startDate, endDate);
    }

    const started = await this.sessionRepository.count({
      where: whereClause,
      relations: ['survey'],
    });

    if (started === 0) return 0;

    const completed = await this.sessionRepository.count({
      where: {
        ...whereClause,
        status: SurveySessionStatus.COMPLETED,
      },
      relations: ['survey'],
    });

    return Math.round((completed / started) * 100 * 100) / 100;
  }

  /**
   * Calculate average completion time in minutes for completed surveys
   */
  async getAverageCompletionTime(type: string): Promise<number | null> {
    const sessions = await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.survey', 'survey')
      .where('survey.type = :type', { type })
      .andWhere('session.status = :status', { status: SurveySessionStatus.COMPLETED })
      .getMany();

    if (sessions.length === 0) return null;

    const totalMinutes = sessions.reduce((sum, session) => {
      const diffMs = session.updated_at.getTime() - session.created_at.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      return sum + diffMinutes;
    }, 0);

    return Math.round(totalMinutes / sessions.length);
  }

  /**
   * Calculate average score across all answers for a survey type
   */
  async getAverageScores(
    type: string,
    startDate: Date | null,
    endDate: Date | null,
  ): Promise<number | null> {
    const queryBuilder = this.answerRepository
      .createQueryBuilder('answer')
      .select('AVG(answer.score)', 'avg')
      .leftJoin('answer.session', 'session')
      .leftJoin('session.survey', 'survey')
      .where('survey.type = :type', { type });

    if (startDate && endDate) {
      queryBuilder.andWhere('answer.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const result = await queryBuilder.getRawOne();

    if (!result || result.avg === null) return null;

    return Math.round(parseFloat(result.avg) * 100) / 100;
  }

  // ==================== Financial Metrics ====================

  /**
   * Get count of paid retake sessions within date range
   */
  async getPaidRetakes(
    startDate: Date | null,
    endDate: Date | null,
  ): Promise<number> {
    const whereClause: any = {
      status: PaymentStatusEnum.SUCCESSFUL,
      survey_session_id: Not(IsNull()),
    };

    if (startDate && endDate) {
      whereClause.created_at = Between(startDate, endDate);
    }

    return await this.paymentRepository.count({
      where: whereClause,
    });
  }

  /**
   * Get total revenue from all successful payments
   */
  async getTotalRevenue(): Promise<number> {
    const cacheKey = 'total_revenue';
    const cached = this.getFromCache<number>(cacheKey);
    if (cached !== null) return cached;

    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatusEnum.SUCCESSFUL })
      .getRawOne();

    const total = result?.total ? parseInt(result.total) : 0;
    this.setCache(cacheKey, total);
    return total;
  }

  /**
   * Get revenue for a specific period
   */
  async getPeriodRevenue(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatusEnum.SUCCESSFUL })
      .andWhere('payment.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    return result?.total ? parseInt(result.total) : 0;
  }

  /**
   * Calculate average revenue per user (ARPU)
   */
  async getAverageRevenuePerUser(): Promise<number> {
    const totalRevenue = await this.getTotalRevenue();
    const totalUsers = await this.getTotalUsers();

    if (totalUsers === 0) return 0;

    return Math.round((totalRevenue / totalUsers) * 100) / 100;
  }

  /**
   * Calculate percentage of users who have made at least one payment
   */
  async getPaymentConversionRate(): Promise<number> {
    const totalUsers = await this.getTotalUsers();

    if (totalUsers === 0) return 0;

    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('COUNT(DISTINCT payment.user_telegram_id)', 'count')
      .where('payment.status = :status', { status: PaymentStatusEnum.SUCCESSFUL })
      .getRawOne();

    const payingUsers = result?.count ? parseInt(result.count) : 0;

    return Math.round((payingUsers / totalUsers) * 100 * 100) / 100;
  }

  // ==================== Engagement Rankings ====================

  /**
   * Get top users by number of completed surveys
   */
  async getMostActiveUsers(limit: number = 10): Promise<UserEngagement[]> {
    const results = await this.userRepository
      .createQueryBuilder('user')
      .select('user.telegram_id', 'telegram_id')
      .addSelect('user.first_name', 'first_name')
      .addSelect('user.username', 'username')
      .addSelect('COUNT(session.id)', 'completed_count')
      .addSelect('MAX(session.updated_at)', 'last_activity')
      .leftJoin('user.survey_sessions', 'session')
      .where('session.status = :status', { status: SurveySessionStatus.COMPLETED })
      .groupBy('user.telegram_id')
      .addGroupBy('user.first_name')
      .addGroupBy('user.username')
      .orderBy('completed_count', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((row) => ({
      telegramId: parseInt(row.telegram_id),
      firstName: row.first_name,
      username: row.username,
      completedSurveys: parseInt(row.completed_count),
      lastActivityDate: new Date(row.last_activity),
    }));
  }

  /**
   * Get top users by average score
   */
  async getTopScoringUsers(limit: number = 10): Promise<UserEngagement[]> {
    const results = await this.userRepository
      .createQueryBuilder('user')
      .select('user.telegram_id', 'telegram_id')
      .addSelect('user.first_name', 'first_name')
      .addSelect('user.username', 'username')
      .addSelect('AVG(answer.score)', 'avg_score')
      .addSelect('COUNT(DISTINCT session.id)', 'completed_count')
      .addSelect('MAX(session.updated_at)', 'last_activity')
      .leftJoin('user.survey_sessions', 'session')
      .leftJoin('session.answers', 'answer')
      .where('session.status = :status', { status: SurveySessionStatus.COMPLETED })
      .groupBy('user.telegram_id')
      .addGroupBy('user.first_name')
      .addGroupBy('user.username')
      .having('COUNT(DISTINCT session.id) > 0')
      .orderBy('avg_score', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((row) => ({
      telegramId: parseInt(row.telegram_id),
      firstName: row.first_name,
      username: row.username,
      completedSurveys: parseInt(row.completed_count),
      averageScore: Math.round(parseFloat(row.avg_score) * 100) / 100,
      lastActivityDate: new Date(row.last_activity),
    }));
  }

  /**
   * Get users with most survey completions (alias for getMostActiveUsers)
   */
  async getUsersWithMostCompletions(limit: number = 20): Promise<UserEngagement[]> {
    return this.getMostActiveUsers(limit);
  }

  // ==================== Cache Management ====================

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all cached data (useful for testing or after data updates)
   */
  clearCache(): void {
    this.cache.clear();
  }
}
