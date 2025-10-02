import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { SurveyService } from "./survey.service";
import { StartSessionDto, SubmitAnswerDto, SurveyResults, CategoryResult } from "bizass-shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { GetSessionTokenDto } from "./dto/get-session-token.dto";
import { AuthService } from "../auth/auth.service";

@Controller("surveys")
export class SurveyController {
  constructor(
    private readonly surveyService: SurveyService,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  @Post("start")
  async startSession(@Body() startSessionDto: StartSessionDto) {
    const session = await this.surveyService.createNewSession(
      startSessionDto.telegramId,
      startSessionDto.surveyType,
    );

    // Generate session token for API authentication
    const sessionToken = this.jwtService.sign(
      {
        telegramId: startSessionDto.telegramId,
        sessionId: session.id,
        type: "session",
      },
      { expiresIn: "24h" }
    );

    return { session, sessionToken };
  }

  @Post("answer")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async submitAnswer(
    @Body() submitAnswerDto: SubmitAnswerDto,
    @Request() req: any,
  ) {
    // Use session ID from JWT token for security
    const sessionId = req.user.sessionId;
    await this.surveyService.saveAnswer(
      sessionId,
      submitAnswerDto.questionId,
      submitAnswerDto.score,
    );
  }

  @Post("session/:sessionId/token")
  async getSessionToken(
    @Param("sessionId") sessionId: string,
    @Body() dto: GetSessionTokenDto
  ) {
    // Validate Telegram initData (cryptographic verification)
    const { user } = await this.authService.authenticateWithTelegram(dto.initData);

    // Get session to validate it exists
    const session = await this.surveyService.getSession(sessionId);

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    // Normalize both userId values for comparison
    // Handle both formats: number (113961571) and string ("tg_113961571")
    const sessionUserIdStr = String(session.userId).replace(/^tg_/, '');
    const authenticatedUserIdStr = String(user.telegramId);

    // Verify that the session belongs to the authenticated user
    if (sessionUserIdStr !== authenticatedUserIdStr) {
      throw new ForbiddenException("Access denied to this session");
    }

    // Generate session token for this session
    const sessionToken = this.jwtService.sign(
      {
        telegramId: user.telegramId,
        sessionId: session.id,
        type: "session",
      },
      { expiresIn: "24h" }
    );

    return { sessionToken };
  }

  @Get("session/:sessionId")
  @UseGuards(JwtAuthGuard)
  async getSession(@Param("sessionId") sessionId: string, @Request() req: any) {
    // Verify that the session belongs to the authenticated user
    if (req.user.sessionId !== sessionId) {
      throw new ForbiddenException("Access denied to this session");
    }
    return this.surveyService.getSession(sessionId);
  }


  @Post("session/complete")
  @UseGuards(JwtAuthGuard)
  async completeSession(@Request() req: any) {
    return this.surveyService.completeSession(req.user.sessionId);
  }

  @Get("results/:sessionId")
  @UseGuards(JwtAuthGuard)
  async getSurveyResults(@Param("sessionId") sessionId: string, @Request() req: any): Promise<SurveyResults> {
    // Verify that the session belongs to the authenticated user
    if (req.user.sessionId !== sessionId) {
      throw new ForbiddenException("Access denied to this session");
    }
    return this.surveyService.getSurveyResults(sessionId);
  }

  @Get("category/:categoryName/:sessionId")
  @UseGuards(JwtAuthGuard)
  async getCategoryDetails(
    @Param("categoryName") categoryName: string,
    @Param("sessionId") sessionId: string,
    @Request() req: any
  ): Promise<CategoryResult> {
    // Verify that the session belongs to the authenticated user
    if (req.user.sessionId !== sessionId) {
      throw new ForbiddenException("Access denied to this session");
    }

    const result = await this.surveyService.getCategoryDetails(sessionId, categoryName);
    if (!result) {
      throw new NotFoundException(`Category '${categoryName}' not found`);
    }

    return result;
  }

  @Get("user/:telegramId/status")
  async getUserSurveysStatus(@Param("telegramId") telegramId: string) {
    return await this.surveyService.getUserSurveysStatus(parseInt(telegramId));
  }

  @Get(":type")
  async getSurveyStructure(@Param("type") type: string) {
    return this.surveyService.getSurveyStructure(type);
  }
}
