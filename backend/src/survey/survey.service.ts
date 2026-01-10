import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SurveyType, SurveySession, Survey, SessionStatus, SurveyResults, CategoryResult } from "bizass-shared";
import {
  Survey as SurveyEntity,
  SurveySession as SurveySessionEntity,
  Answer,
  User,
} from "../entities";
import { SurveyVersion, SurveyVersionStatus } from "../entities/survey-version.entity";
import { AnalyticsCalculator } from "../common/utils/analytics-calculator.util";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class SurveyService {
  // Cache for latest published versions (TTL handled by application restart)
  private versionCache: Map<string, { version: SurveyVersion; cachedAt: number }> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(SurveyEntity)
    private surveyRepository: Repository<SurveyEntity>,
    @InjectRepository(SurveySessionEntity)
    private sessionRepository: Repository<SurveySessionEntity>,
    @InjectRepository(Answer)
    private answerRepository: Repository<Answer>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SurveyVersion)
    private versionRepository: Repository<SurveyVersion>,
    private analyticsCalculator: AnalyticsCalculator,
  ) {}

  /**
   * Gets the latest published version for a survey type
   * Uses caching to improve performance (TTL 5 minutes)
   */
  async getLatestPublishedVersion(surveyType: string): Promise<SurveyVersion> {
    const cacheKey = surveyType.toUpperCase();
    const cached = this.versionCache.get(cacheKey);

    // Return cached version if still valid
    if (cached && Date.now() - cached.cachedAt < this.CACHE_TTL_MS) {
      return cached.version;
    }

    // Get survey by type
    const survey = await this.surveyRepository.findOne({
      where: { type: surveyType.toUpperCase() },
      relations: ["latest_published_version"],
    });
    if (!survey) {
      throw new NotFoundException(`Survey type ${surveyType} not found`);
    }

    // Get latest published version
    if (!survey.latest_published_version_id) {
      throw new NotFoundException(
        `No published version found for survey type ${surveyType}`,
      );
    }

    const version = await this.versionRepository.findOne({
      where: { id: survey.latest_published_version_id },
    });
    if (!version) {
      throw new NotFoundException(
        `Published version ${survey.latest_published_version_id} not found`,
      );
    }

    // Update cache
    this.versionCache.set(cacheKey, {
      version,
      cachedAt: Date.now(),
    });

    return version;
  }

  /**
   * Invalidates the version cache for a specific survey type
   * Called after publishing a new version
   */
  invalidateVersionCache(surveyType: string): void {
    this.versionCache.delete(surveyType.toUpperCase());
  }

  async createNewSession(
    userId: number,
    type: string,
  ): Promise<SurveySession> {

    // Check if user exists, create if not
    let user = await this.userRepository.findOne({
      where: { telegram_id: userId },
    });
    if (!user) {
      user = this.userRepository.create({
        telegram_id: userId,
        first_name: "Unknown", // Will be updated from Telegram data
      });
      await this.userRepository.save(user);
    }

    // Get survey by type (convert to uppercase for case-insensitive matching)
    const survey = await this.surveyRepository.findOne({
      where: { type: type.toUpperCase() }
    });
    if (!survey) {
      throw new NotFoundException(`Survey type ${type} not found`);
    }

    // Get latest published version
    const latestVersion = await this.getLatestPublishedVersion(type);

    // Create new session with survey_version_id
    const session = this.sessionRepository.create({
      id: uuidv4(),
      user_telegram_id: userId,
      survey_id: survey.id,
      survey_version_id: latestVersion.id,
      status: SessionStatus.IN_PROGRESS,
    });

    const savedSession = await this.sessionRepository.save(session);

    return {
      id: savedSession.id,
      userId: savedSession.user_telegram_id,
      surveyType: type as SurveyType,
      status: savedSession.status as SessionStatus,
      answers: {},
      createdAt: savedSession.created_at.toISOString(),
    };
  }

  async saveAnswer(
    sessionId: string,
    questionId: number,
    score: number,
  ): Promise<void> {
    // Validate score range
    if (!Number.isInteger(score) || score < 1 || score > 10) {
      throw new BadRequestException(
        "Score must be an integer between 1 and 10",
      );
    }

    // Check if session exists
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    // Check if answer already exists
    const existingAnswer = await this.answerRepository.findOne({
      where: { session_id: sessionId, question_id: questionId },
    });

    if (existingAnswer) {
      // Update existing answer
      existingAnswer.score = score;
      await this.answerRepository.save(existingAnswer);
    } else {
      // Create new answer
      const answer = this.answerRepository.create({
        session_id: sessionId,
        question_id: questionId,
        score,
      });
      await this.answerRepository.save(answer);
    }
  }

  /**
   * Gets survey structure from the latest published version
   * Replaces file-based approach with database version
   */
  async getSurveyStructure(type: string): Promise<Survey> {
    const version = await this.getLatestPublishedVersion(type);

    return {
      id: version.survey_id,
      type: version.type as SurveyType,
      name: version.name,
      structure: version.structure,
    };
  }

  /**
   * Gets survey structure for a specific session
   * Uses the version associated with the session (prevents breaking active sessions)
   */
  async getSurveyStructureForSession(sessionId: string): Promise<Survey> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ["survey_version"],
    });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    if (!session.survey_version) {
      throw new NotFoundException(
        `Survey version for session ${sessionId} not found`,
      );
    }

    return {
      id: session.survey_version.survey_id,
      type: session.survey_version.type as SurveyType,
      name: session.survey_version.name,
      structure: session.survey_version.structure,
    };
  }

  async getSession(sessionId: string): Promise<SurveySession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ["answers", "survey"],
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    // Convert answers to the expected format
    const answers: Record<number, number> = {};
    session.answers.forEach((answer) => {
      answers[answer.question_id] = answer.score;
    });

    return {
      id: session.id,
      // Ensure userId is always a number (TypeORM may return bigint as string)
      userId: typeof session.user_telegram_id === 'string'
        ? parseInt(session.user_telegram_id, 10)
        : session.user_telegram_id,
      surveyType: session.survey.type as SurveyType,
      status: session.status as SessionStatus,
      answers,
      createdAt: session.created_at.toISOString(),
    };
  }

  async completeSession(sessionId: string): Promise<any> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ["answers", "survey"],
    });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    // Update session status to completed
    session.status = SessionStatus.COMPLETED;
    await this.sessionRepository.save(session);

    // Note: Reports are now generated on-demand when requested,
    // not automatically on session completion
    return {
      message: "Session completed successfully",
      sessionId,
    };
  }

  async isFirstSurvey(userId: number): Promise<boolean> {
    const completedSessions = await this.sessionRepository.count({
      where: {
        user_telegram_id: userId,
        status: SessionStatus.COMPLETED,
      },
    });

    return completedSessions === 0;
  }

  async canStartNewSurvey(userId: number): Promise<boolean> {
    // Check if user has any in-progress sessions
    const inProgressSessions = await this.sessionRepository.count({
      where: {
        user_telegram_id: userId,
        status: SessionStatus.IN_PROGRESS,
      },
    });

    return inProgressSessions === 0;
  }

  /**
   * Get user sessions with optimized query
   * Uses indexes on user_telegram_id and created_at for performance
   */
  async getUserSessions(userId: number): Promise<SurveySessionEntity[]> {
    return await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.survey', 'survey')
      .where('session.user_telegram_id = :userId', { userId })
      .orderBy('session.created_at', 'DESC')
      .getMany();
  }

  /**
   * Get completed sessions for a user with optimized query
   * Uses composite index on (user_telegram_id, status) for better performance
   */
  async getCompletedSessions(userId: number): Promise<SurveySessionEntity[]> {
    return await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.survey', 'survey')
      .where('session.user_telegram_id = :userId', { userId })
      .andWhere('session.status = :status', { status: SessionStatus.COMPLETED })
      .orderBy('session.updated_at', 'DESC')
      .getMany();
  }

  /**
   * Get session with answers using efficient join
   * Optimized to load all related data in a single query
   */
  async getSessionWithAnswers(sessionId: string): Promise<SurveySessionEntity> {
    const session = await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.answers', 'answers')
      .leftJoinAndSelect('session.survey', 'survey')
      .leftJoinAndSelect('session.survey_version', 'survey_version')
      .where('session.id = :sessionId', { sessionId })
      .getOne();

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    return session;
  }

  async getUserSurveysStatus(telegramId: number) {
    const sessions = await this.getUserSessions(telegramId);

    const expressSessions = sessions.filter(s => s.survey.type === 'EXPRESS');
    const fullSessions = sessions.filter(s => s.survey.type === 'FULL');

    return {
      express: this.analyzeSurveyStatus(expressSessions),
      full: this.analyzeSurveyStatus(fullSessions)
    };
  }

  private analyzeSurveyStatus(sessions: SurveySessionEntity[]) {
    const completedSessions = sessions.filter(s => s.status === 'COMPLETED');
    const activeSessions = sessions.filter(s => s.status === 'IN_PROGRESS');

    return {
      hasCompleted: completedSessions.length > 0,
      activeSessionId: activeSessions[0]?.id || null,
      lastCompletedAt: completedSessions[0]?.updated_at?.toISOString() || null
    };
  }

  /**
   * Check if user has already used their free survey
   * Returns true if user has completed at least one survey (of any type)
   * Optimized with composite index on (user_telegram_id, status)
   */
  async hasUsedFreeSurvey(userId: number): Promise<boolean> {
    const completedCount = await this.sessionRepository
      .createQueryBuilder('session')
      .where('session.user_telegram_id = :userId', { userId })
      .andWhere('session.status = :status', { status: SessionStatus.COMPLETED })
      .getCount();

    return completedCount > 0;
  }

  /**
   * Check if user must pay for a new survey
   * First survey (any type) is free, all subsequent surveys require payment
   */
  async requiresPayment(userId: number): Promise<boolean> {
    return await this.hasUsedFreeSurvey(userId);
  }

  /**
   * Start a new survey with payment requirement check
   * First survey is free, all subsequent surveys require payment
   */
  async startSurveyWithPaymentCheck(
    userId: number,
    type: string,
  ): Promise<SurveySession & { requiresPayment: boolean }> {
    // Check if user exists, create if not
    let user = await this.userRepository.findOne({
      where: { telegram_id: userId },
    });
    if (!user) {
      user = this.userRepository.create({
        telegram_id: userId,
        first_name: "Unknown", // Will be updated from Telegram data
      });
      await this.userRepository.save(user);
    }

    // Get survey by type (convert to uppercase for case-insensitive matching)
    const survey = await this.surveyRepository.findOne({
      where: { type: type.toUpperCase() }
    });
    if (!survey) {
      throw new NotFoundException(`Survey type ${type} not found`);
    }

    // Get latest published version
    const latestVersion = await this.getLatestPublishedVersion(type);

    // Check if payment is required
    const requiresPayment = await this.requiresPayment(userId);

    // Create new session with payment requirement flag and survey_version_id
    const session = this.sessionRepository.create({
      id: uuidv4(),
      user_telegram_id: userId,
      survey_id: survey.id,
      survey_version_id: latestVersion.id,
      status: SessionStatus.IN_PROGRESS,
      requires_payment: requiresPayment,
    });

    const savedSession = await this.sessionRepository.save(session);

    return {
      id: savedSession.id,
      userId: savedSession.user_telegram_id,
      surveyType: type as SurveyType,
      status: savedSession.status as SessionStatus,
      answers: {},
      createdAt: savedSession.created_at.toISOString(),
      requiresPayment,
    };
  }

  async generateReport(
    sessionId: string,
    isPaid: boolean = false,
  ): Promise<any> {
    // This method will be implemented when we integrate with the ReportService
    // For now, return a mock report
    return {
      id: uuidv4(),
      session_id: sessionId,
      payment_status: isPaid ? "PAID" : "FREE",
      storage_url: `/uploads/report_${sessionId}.pdf`,
      created_at: new Date().toISOString(),
    };
  }

  async getPaidReport(sessionId: string): Promise<any | null> {
    // This method will check if a paid report exists for the session
    // For now, return null (no paid reports exist)
    return null;
  }

  /**
   * Gets comprehensive survey results with CSV content for display
   * Implements clean architecture principles and leverages existing analytics
   * Uses session's specific version to prevent breaking active sessions
   */
  async getSurveyResults(sessionId: string): Promise<SurveyResults> {
    // Get session with answers using optimized query
    const session = await this.getSessionWithAnswers(sessionId);

    // Get survey structure from session's version (not latest published)
    const surveyType = session.survey.type.toLowerCase() as 'express' | 'full';
    const surveyStructure = await this.getSurveyStructureForSession(sessionId);

    // Convert answers to the format expected by analytics calculator
    const answers = session.answers.map(answer => ({
      questionId: answer.question_id,
      score: answer.score
    }));

    // Use AnalyticsCalculator to compute comprehensive results
    return this.analyticsCalculator.calculateSurveyResults(
      sessionId,
      answers,
      surveyStructure,
      surveyType
    );
  }

  /**
   * Gets detailed category results for category detail pages
   * Follows single responsibility principle - delegates to AnalyticsCalculator
   * Uses session's specific version to prevent breaking active sessions
   */
  async getCategoryDetails(sessionId: string, categoryName: string): Promise<CategoryResult | null> {
    // Get session with answers using optimized query
    const session = await this.getSessionWithAnswers(sessionId);

    // Get survey structure from session's version (not latest published)
    const surveyType = session.survey.type.toLowerCase() as 'express' | 'full';
    const surveyStructure = await this.getSurveyStructureForSession(sessionId);

    // Convert answers to the format expected by analytics calculator
    const answers = session.answers.map(answer => ({
      questionId: answer.question_id,
      score: answer.score
    }));

    // Use AnalyticsCalculator to get category details
    return this.analyticsCalculator.getCategoryDetails(
      sessionId,
      categoryName,
      answers,
      surveyStructure,
      surveyType
    );
  }
}
