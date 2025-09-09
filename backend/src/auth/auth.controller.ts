import { Controller, Post, Body, Get, Query, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SurveyType } from 'bizass-shared';

export interface AuthenticateDto {
  token: string;
  surveyType: SurveyType;
}

export interface AuthResponse {
  session: any;
  sessionToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('authenticate')
  async authenticate(@Body() authenticateDto: AuthenticateDto): Promise<AuthResponse> {
    const { session, sessionToken } = await this.authService.authenticateAndCreateSession(
      authenticateDto.token,
      authenticateDto.surveyType,
    );

    return {
      session,
      sessionToken,
    };
  }

  @Get('validate')
  async validateToken(@Query('token') token: string) {
    const result = this.authService.validateSessionToken(token);
    if (!result) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return result;
  }

  @Post('generate-token')
  async generateToken(@Body() body: { telegramId: number }) {
    // This endpoint is for testing purposes - in production, this would be called by the Telegram bot
    return this.authService.generateAuthToken(body.telegramId);
  }
}
