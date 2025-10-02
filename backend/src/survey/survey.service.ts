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
import { AnalyticsCalculator } from "../common/utils/analytics-calculator.util";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(SurveyEntity)
    private surveyRepository: Repository<SurveyEntity>,
    @InjectRepository(SurveySessionEntity)
    private sessionRepository: Repository<SurveySessionEntity>,
    @InjectRepository(Answer)
    private answerRepository: Repository<Answer>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private analyticsCalculator: AnalyticsCalculator,
  ) {}

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

    // Create new session
    const session = this.sessionRepository.create({
      id: uuidv4(),
      user_telegram_id: userId,
      survey_id: survey.id,
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

  async getSurveyStructure(type: string): Promise<Survey> {
    // For now, read from hardcoded JSON file
    // TODO: Move to database in future iterations
    const dataPath = path.join(__dirname, "../data/survey-data.json");
    const surveyData = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    const survey = surveyData[type.toUpperCase()];
    if (!survey) {
      throw new NotFoundException(`Survey type ${type} not found`);
    }

    return survey;
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
      userId: session.user_telegram_id,
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

    // Generate free report automatically
    try {
      // Import ReportService dynamically to avoid circular dependency
      const { ReportService } = await import("../report/report.service");
      const reportService = new ReportService(
        this.sessionRepository.manager.getRepository("Report"),
        this.sessionRepository,
        this.answerRepository,
        null, // AnalyticsCalculator - will be injected properly in module
        null, // PdfGenerator - will be injected properly in module
      );

      const report = await reportService.generateReport(sessionId, false);

      return {
        message: "Session completed successfully",
        sessionId,
        reportId: report.id,
        reportUrl: report.storage_url,
      };
    } catch (error) {
      console.error("Error generating report:", error);
      return {
        message: "Session completed successfully",
        sessionId,
        note: "Report generation failed, but session was completed",
      };
    }
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

  async getUserSessions(userId: number): Promise<SurveySessionEntity[]> {
    return await this.sessionRepository.find({
      where: { user_telegram_id: userId },
      relations: ["survey"],
      order: { created_at: "DESC" },
    });
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
   */
  async getSurveyResults(sessionId: string): Promise<SurveyResults> {
    // Get session with answers
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ["answers", "survey"],
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    // Get survey structure
    const surveyType = session.survey.type.toLowerCase() as 'express' | 'full';
    const surveyStructure = await this.getSurveyStructure(surveyType);

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
   */
  async getCategoryDetails(sessionId: string, categoryName: string): Promise<CategoryResult | null> {
    // Get session with answers
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ["answers", "survey"],
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    // Get survey structure
    const surveyType = session.survey.type.toLowerCase() as 'express' | 'full';
    const surveyStructure = await this.getSurveyStructure(surveyType);

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
