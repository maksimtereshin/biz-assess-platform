import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Res,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { ReportService } from "./report.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Response } from "express";

@Controller("reports")
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  /**
   * Generate and stream PDF report on-demand
   * No file storage - PDF is generated and streamed directly to client
   *
   * GET /reports/generate/:sessionId
   */
  @Get("generate/:sessionId")
  @UseGuards(JwtAuthGuard)
  async generateReport(
    @Param("sessionId") sessionId: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    try {
      // Verify the session belongs to the authenticated user
      if (req.user.sessionId !== sessionId) {
        throw new ForbiddenException("Unauthorized access to session");
      }

      const userId = req.user.telegramId;

      // Determine if report should be free or paid
      const isFree = await this.reportService.isReportFree(userId);

      // If not free, check if user has paid for this session
      if (!isFree) {
        const hasPaid = await this.reportService.hasUserPaidForSession(sessionId);
        if (!hasPaid) {
          throw new BadRequestException({
            statusCode: HttpStatus.PAYMENT_REQUIRED,
            message: "Payment required for this report",
            error: "PAYMENT_REQUIRED",
            sessionId,
          });
        }
      }

      // Generate PDF buffer
      const pdfBuffer = await this.reportService.generateReport(sessionId, !isFree);

      // Set headers for PDF streaming
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="business-assessment-${sessionId}.pdf"`,
      );
      res.setHeader("Content-Length", pdfBuffer.length);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      // Stream PDF buffer to client
      res.send(pdfBuffer);
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to generate report: ${error.message}`);
    }
  }

  /**
   * Legacy endpoint - Generate paid report
   * Deprecated in favor of unified /generate/:sessionId endpoint
   */
  @Post("generate-paid/:sessionId")
  @UseGuards(JwtAuthGuard)
  async generatePaidReport(
    @Param("sessionId") sessionId: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    try {
      // Verify the session belongs to the authenticated user
      if (req.user.sessionId !== sessionId) {
        throw new ForbiddenException("Unauthorized access to session");
      }

      const userId = req.user.telegramId;

      // Check if user has paid for this session
      const hasPaid = await this.reportService.hasUserPaidForSession(sessionId);
      if (!hasPaid) {
        throw new BadRequestException({
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          message: "Payment required for this report",
          error: "PAYMENT_REQUIRED",
          sessionId,
        });
      }

      // Generate paid PDF buffer
      const pdfBuffer = await this.reportService.generateReport(sessionId, true);

      // Set headers for PDF streaming
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="business-assessment-premium-${sessionId}.pdf"`,
      );
      res.setHeader("Content-Length", pdfBuffer.length);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      // Stream PDF buffer to client
      res.send(pdfBuffer);
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to generate report: ${error.message}`);
    }
  }

  @Get(":reportId")
  @UseGuards(JwtAuthGuard)
  async getReport(@Param("reportId") reportId: string) {
    return await this.reportService.getReport(reportId);
  }

  @Get("user/:userId")
  @UseGuards(JwtAuthGuard)
  async getUserReports(@Param("userId") userId: number, @Request() req: any) {
    // Verify the user is requesting their own reports
    if (req.user.telegramId !== userId) {
      throw new ForbiddenException("Unauthorized access to user reports");
    }

    return await this.reportService.getUserReports(userId);
  }

  /**
   * Legacy download endpoint - no longer used with on-demand generation
   * Kept for backwards compatibility
   */
  @Get("download/:reportId")
  @UseGuards(JwtAuthGuard)
  async downloadReport(
    @Param("reportId") reportId: string,
    @Res() res: Response,
    @Request() req: any,
  ) {
    const report = await this.reportService.getReport(reportId);

    // Verify the user has access to this report
    if (req.user.telegramId !== report.session.user_telegram_id) {
      throw new ForbiddenException("Unauthorized access to report");
    }

    // Since we no longer store files, redirect to generate endpoint
    throw new BadRequestException(
      "This endpoint is deprecated. Please use /reports/generate/:sessionId instead.",
    );
  }
}
