import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AnalyticsCalculator } from "../common/utils/analytics-calculator.util";
import { PdfGenerator } from "../common/utils/pdf-generator.util";
import { Report, SurveySession, Answer } from "../entities";
import { AnalyticsResult, PaymentStatus } from "bizass-shared";
import { v4 as uuidv4 } from "uuid";

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
  ) {}

  async generateReport(
    sessionId: string,
    isPaid: boolean = false,
  ): Promise<Report> {
    // Get session with answers
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ["answers", "survey"],
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    // Calculate analytics
    const answers = session.answers.map((answer) => ({
      questionId: answer.question_id,
      score: answer.score,
    }));

    const analytics = this.calculateDetailedAnalytics(
      answers,
      session.survey.structure,
    );

    // Generate PDF
    const pdfBuffer = await this.pdfGenerator.createPdf(analytics, isPaid);

    // Save PDF to storage (for now, we'll store it locally)
    const fileName = `report_${sessionId}_${Date.now()}.pdf`;
    const storageUrl = await this.savePdfToStorage(pdfBuffer, fileName);

    // Create report record
    const report = this.reportRepository.create({
      id: uuidv4(),
      session_id: sessionId,
      payment_status: isPaid ? PaymentStatus.PAID : PaymentStatus.FREE,
      storage_url: storageUrl,
      analytics_summary: analytics,
    });

    return await this.reportRepository.save(report);
  }

  private calculateDetailedAnalytics(
    answers: Array<{ questionId: number; score: number }>,
    surveyStructure: any,
  ): AnalyticsResult {
    // Use the AnalyticsCalculator with the survey structure for proper category/subcategory calculations
    return this.analyticsCalculator.calculateScores(answers, surveyStructure);
  }

  private async savePdfToStorage(
    pdfBuffer: Buffer,
    fileName: string,
  ): Promise<string> {
    // For now, save to local storage
    // In production, this would upload to S3 or similar
    const fs = require("fs");
    const path = require("path");

    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    // Return the URL (in production, this would be the S3 URL)
    return `/uploads/${fileName}`;
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
    return await this.reportRepository
      .createQueryBuilder("report")
      .leftJoinAndSelect("report.session", "session")
      .where("session.user_telegram_id = :userId", { userId })
      .orderBy("report.created_at", "DESC")
      .getMany();
  }
}
