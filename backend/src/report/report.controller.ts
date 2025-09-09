import { Controller, Get, Post, Param, UseGuards, Request, HttpCode, HttpStatus, Res, NotFoundException } from '@nestjs/common';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('generate/:sessionId')
  @UseGuards(JwtAuthGuard)
  async generateReport(@Param('sessionId') sessionId: string, @Request() req: any) {
    // Verify the session belongs to the authenticated user
    if (req.user.sessionId !== sessionId) {
      throw new Error('Unauthorized access to session');
    }
    
    return await this.reportService.generateReport(sessionId, false);
  }

  @Post('generate-paid/:sessionId')
  @UseGuards(JwtAuthGuard)
  async generatePaidReport(@Param('sessionId') sessionId: string, @Request() req: any) {
    // Verify the session belongs to the authenticated user
    if (req.user.sessionId !== sessionId) {
      throw new Error('Unauthorized access to session');
    }
    
    return await this.reportService.generateReport(sessionId, true);
  }

  @Get(':reportId')
  @UseGuards(JwtAuthGuard)
  async getReport(@Param('reportId') reportId: string) {
    return await this.reportService.getReport(reportId);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserReports(@Param('userId') userId: number, @Request() req: any) {
    // Verify the user is requesting their own reports
    if (req.user.telegramId !== userId) {
      throw new Error('Unauthorized access to user reports');
    }
    
    return await this.reportService.getUserReports(userId);
  }

  @Get('download/:reportId')
  @UseGuards(JwtAuthGuard)
  async downloadReport(@Param('reportId') reportId: string, @Res() res: Response, @Request() req: any) {
    const report = await this.reportService.getReport(reportId);
    
    // Verify the user has access to this report
    if (req.user.telegramId !== report.session.user_telegram_id) {
      throw new Error('Unauthorized access to report');
    }
    
    // Extract filename from storage URL
    const fileName = report.storage_url.split('/').pop();
    const filePath = path.join(process.cwd(), 'uploads', fileName);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Report file not found');
    }
    
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="business-assessment-report-${reportId}.pdf"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
}
