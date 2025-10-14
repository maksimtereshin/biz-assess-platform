import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AnalyticsCalculator } from "../common/utils/analytics-calculator.util";
import { PdfGenerator } from "../common/utils/pdf-generator.util";
import { Report, SurveySession, Answer } from "../entities";
import { AnalyticsResult, PaymentStatus, SurveyResults } from "bizass-shared";
import { QueryCacheService } from "../common/services/query-cache.service";

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(SurveySession)
    private sessionRepository: Repository<SurveySession>,
    @InjectRepository(Answer)
    private answerRepository: Repository<Answer>,
    private readonly pdfGenerator: PdfGenerator,
    private readonly analyticsCalculator: AnalyticsCalculator,
    private readonly cacheService: QueryCacheService,
  ) {}

  /**
   * Generate PDF report on-demand without storage
   * Returns PDF buffer directly for streaming to client
   * Optimized with caching for analytics calculations
   *
   * @param sessionId - Survey session ID
   * @param isPaid - Whether to generate paid version (with detailed category analysis)
   * @returns PDF buffer ready for streaming
   */
  async generateReport(
    sessionId: string,
    isPaid: boolean = false,
  ): Promise<Buffer> {
    // Get session with answers using optimized query
    const session = await this.getSessionWithAnswersOptimized(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    // Prepare answers for analytics calculation
    const answers = session.answers.map((answer) => ({
      questionId: answer.question_id,
      score: answer.score,
    }));

    // Determine survey type
    const surveyType = session.survey.type === 'EXPRESS' ? 'express' : 'full';

    // Generate survey results using appropriate method
    const surveyResults = await this.generateSurveyResultsWithCache(
      sessionId,
      answers,
      session.survey.structure,
      surveyType,
      isPaid,
    );

    // Generate PDF buffer (no storage)
    const pdfBuffer = await this.pdfGenerator.createPdf(surveyResults, isPaid);

    return pdfBuffer;
  }

  /**
   * Get session with answers using optimized query
   * Uses single query with joins to avoid N+1 queries
   * Implements caching for frequently accessed sessions
   */
  private async getSessionWithAnswersOptimized(
    sessionId: string,
  ): Promise<SurveySession | null> {
    // Check cache first
    const cacheKey = `session:${sessionId}:with-answers`;
    const cached = this.cacheService.get<SurveySession>(cacheKey);

    if (cached) {
      return cached;
    }

    // Query with optimized joins
    const session = await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.answers', 'answers')
      .leftJoinAndSelect('session.survey', 'survey')
      .where('session.id = :sessionId', { sessionId })
      .getOne();

    if (session) {
      // Cache for 5 minutes (sessions don't change after completion)
      this.cacheService.set(cacheKey, session, 300000);
    }

    return session;
  }

  /**
   * Generate survey results with caching
   * Uses free or paid version data generation based on isPaid flag
   */
  private async generateSurveyResultsWithCache(
    sessionId: string,
    answers: Array<{ questionId: number; score: number }>,
    surveyStructure: any,
    surveyType: 'express' | 'full',
    isPaid: boolean,
  ): Promise<SurveyResults> {
    const cacheKey = `survey-results:${sessionId}:${isPaid ? 'paid' : 'free'}`;

    return await this.cacheService.getOrCompute(
      cacheKey,
      async () => {
        if (isPaid) {
          return this.analyticsCalculator.generatePaidVersionData(
            sessionId,
            answers,
            surveyStructure,
            surveyType,
          );
        } else {
          return this.analyticsCalculator.generateFreeVersionData(
            sessionId,
            answers,
            surveyStructure,
            surveyType,
          );
        }
      },
      300000, // Cache for 5 minutes
    );
  }

  /**
   * Calculate analytics with caching (legacy method for backward compatibility)
   * Caches analytics results to avoid recalculation
   */
  private async calculateAnalyticsWithCache(
    sessionId: string,
    answers: Array<{ questionId: number; score: number }>,
    surveyStructure: any,
  ): Promise<AnalyticsResult> {
    const cacheKey = `analytics:${sessionId}`;

    return await this.cacheService.getOrCompute(
      cacheKey,
      async () => {
        return this.analyticsCalculator.calculateScores(
          answers,
          surveyStructure,
        );
      },
      300000, // Cache for 5 minutes
    );
  }

  /**
   * Count completed surveys for a user
   * Used to determine if report should be free or paid
   * Optimized with query builder and caching
   *
   * @param userId - Telegram user ID
   * @returns Number of completed surveys
   */
  async getUserCompletedSessionsCount(userId: number): Promise<number> {
    const cacheKey = `user:${userId}:completed-count`;

    return await this.cacheService.getOrCompute(
      cacheKey,
      async () => {
        const count = await this.sessionRepository
          .createQueryBuilder('session')
          .where('session.user_telegram_id = :userId', { userId })
          .andWhere('session.status = :status', { status: 'COMPLETED' })
          .getCount();

        return count;
      },
      60000, // Cache for 1 minute
    );
  }

  /**
   * Determine if current report should be free
   * First completed survey gets a free report
   *
   * @param userId - Telegram user ID
   * @returns true if report is free (first survey), false otherwise
   */
  async isReportFree(userId: number): Promise<boolean> {
    const completedCount = await this.getUserCompletedSessionsCount(userId);
    return completedCount === 1;
  }

  /**
   * Check if user has already paid for a specific session's report
   *
   * @param sessionId - Survey session ID
   * @returns true if paid report exists for session
   */
  async hasUserPaidForSession(sessionId: string): Promise<boolean> {
    const cacheKey = `session:${sessionId}:has-paid`;

    return await this.cacheService.getOrCompute(
      cacheKey,
      async () => {
        const paidReport = await this.reportRepository.findOne({
          where: {
            session_id: sessionId,
            payment_status: PaymentStatus.PAID,
          },
        });

        return !!paidReport;
      },
      300000, // Cache for 5 minutes
    );
  }

  /**
   * Get completed sessions for a user with optimized query
   * Uses indexes and caching for better performance
   *
   * @param userId - Telegram user ID
   * @returns Array of completed sessions
   */
  async getUserCompletedSessions(
    userId: number,
  ): Promise<SurveySession[]> {
    const cacheKey = `user:${userId}:completed-sessions`;

    return await this.cacheService.getOrCompute(
      cacheKey,
      async () => {
        const sessions = await this.sessionRepository
          .createQueryBuilder('session')
          .leftJoinAndSelect('session.survey', 'survey')
          .where('session.user_telegram_id = :userId', { userId })
          .andWhere('session.status = :status', { status: 'COMPLETED' })
          .orderBy('session.updated_at', 'DESC')
          .getMany();

        return sessions;
      },
      60000, // Cache for 1 minute
    );
  }

  /**
   * Invalidate caches when session data changes
   * Should be called when a session is completed or updated
   *
   * @param userId - User ID
   * @param sessionId - Session ID
   */
  invalidateSessionCaches(userId: number, sessionId: string): void {
    // Invalidate specific session cache
    this.cacheService.invalidate(`session:${sessionId}:with-answers`);
    this.cacheService.invalidate(`session:${sessionId}:has-paid`);
    this.cacheService.invalidate(`analytics:${sessionId}`);
    this.cacheService.invalidate(`survey-results:${sessionId}:free`);
    this.cacheService.invalidate(`survey-results:${sessionId}:paid`);

    // Invalidate user-level caches
    this.cacheService.invalidate(`user:${userId}:completed-count`);
    this.cacheService.invalidate(`user:${userId}:completed-sessions`);
  }

  async getReport(reportId: string): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
      relations: ["session"],
    });

    if (!report) {
      throw new NotFoundException(`Report ${reportId} not found`);
    }

    return report;
  }

  async getUserReports(userId: number): Promise<Report[]> {
    const cacheKey = `user:${userId}:reports`;

    return await this.cacheService.getOrCompute(
      cacheKey,
      async () => {
        return await this.reportRepository
          .createQueryBuilder('report')
          .leftJoinAndSelect('report.session', 'session')
          .where('session.user_telegram_id = :userId', { userId })
          .orderBy('report.created_at', 'DESC')
          .getMany();
      },
      60000, // Cache for 1 minute
    );
  }
}
