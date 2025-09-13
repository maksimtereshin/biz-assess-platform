import { Controller, Post, Body, Get, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticateDto } from './dto/authenticate.dto';
import { LoginDto } from './dto/login.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { DevelopmentOnlyGuard } from '../common/guards/development-only.guard';

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
  async validateToken(@Query() query: ValidateTokenDto) {
    const result = this.authService.validateSessionToken(query.token);
    if (!result) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return result;
  }

  @Post('generate-token')
  @UseGuards(DevelopmentOnlyGuard)
  async generateToken(@Body() loginDto: LoginDto) {
    // This endpoint is for testing purposes - in production, this would be called by the Telegram bot
    return this.authService.generateAuthToken(loginDto.telegramId);
  }
}
