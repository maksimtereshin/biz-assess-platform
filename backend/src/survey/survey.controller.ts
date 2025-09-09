import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { StartSessionDto, SubmitAnswerDto } from 'bizass-shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('surveys')
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Post('start')
  async startSession(@Body() startSessionDto: StartSessionDto) {
    return this.surveyService.createNewSession(
      startSessionDto.telegramId,
      startSessionDto.surveyType,
    );
  }

  @Post('answer')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async submitAnswer(@Body() submitAnswerDto: SubmitAnswerDto, @Request() req: any) {
    // Use session ID from JWT token for security
    const sessionId = req.user.sessionId;
    await this.surveyService.saveAnswer(
      sessionId,
      submitAnswerDto.questionId,
      submitAnswerDto.score,
    );
  }

  @Get(':type')
  async getSurveyStructure(@Param('type') type: string) {
    return this.surveyService.getSurveyStructure(type);
  }

  @Get('session/:sessionId')
  @UseGuards(JwtAuthGuard)
  async getSession(@Param('sessionId') sessionId: string, @Request() req: any) {
    // Verify that the session belongs to the authenticated user
    if (req.user.sessionId !== sessionId) {
      throw new Error('Unauthorized access to session');
    }
    return this.surveyService.getSession(sessionId);
  }

  @Get('session/current')
  @UseGuards(JwtAuthGuard)
  async getCurrentSession(@Request() req: any) {
    return this.surveyService.getSession(req.user.sessionId);
  }

  @Post('session/complete')
  @UseGuards(JwtAuthGuard)
  async completeSession(@Request() req: any) {
    return this.surveyService.completeSession(req.user.sessionId);
  }
}
