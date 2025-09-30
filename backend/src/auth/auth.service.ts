import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthToken, SurveySession } from "bizass-shared";
import { SurveyService } from "../survey/survey.service";
import { SurveyType } from "bizass-shared";
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private surveyService: SurveyService,
  ) {}

  /**
   * Authenticates user with Telegram WebApp initData
   * Validates the initData using HMAC-SHA256 signature
   */
  async authenticateWithTelegram(initData: string): Promise<{ token: string; user: any }> {
    try {
      // Parse initData
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      urlParams.delete('hash');

      // Check if hash exists
      if (!hash) {
        throw new UnauthorizedException('No hash provided in initData');
      }

      // Get bot token from environment
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        throw new UnauthorizedException('Bot token not configured');
      }

      // Create data string for verification
      const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      // Create secret key from bot token
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();

      // Calculate expected hash
      const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      // Verify hash
      if (hash !== expectedHash) {
        throw new UnauthorizedException('Invalid Telegram initData signature');
      }

      // Parse user data
      const userParam = urlParams.get('user');
      if (!userParam) {
        throw new UnauthorizedException('No user data in initData');
      }

      const userData = JSON.parse(userParam);
      const telegramId = userData.id;

      if (!telegramId) {
        throw new UnauthorizedException('No user ID in Telegram data');
      }

      // Generate auth token
      const authToken = this.generateAuthToken(telegramId);

      // Return user info as expected by frontend
      const user = {
        id: telegramId,
        telegramId: telegramId,
        username: userData.username,
        firstName: userData.first_name,
        lastName: userData.last_name,
        isAdmin: false,
        stats: {
          totalSurveys: 0,
          paidReports: 0,
          referrals: 0,
        },
      };

      return {
        token: authToken.token,
        user
      };

    } catch (error) {
      console.error('Telegram authentication error:', error);
      throw new UnauthorizedException('Failed to authenticate with Telegram');
    }
  }

  /**
   * Generates a short-lived JWT token for Telegram user authentication
   * Used for creating authenticated survey links
   * In development mode, creates a longer-lived token
   */
  generateAuthToken(telegramId: number): AuthToken {
    const payload = { telegramId };

    // Longer expiration in development for easier testing
    const isDevelopment = process.env.NODE_ENV === 'development';
    const expirationTime = isDevelopment ? 24 * 60 * 60 * 1000 : 60 * 1000; // 24 hours vs 60 seconds

    const token = this.jwtService.sign(payload, {
      expiresIn: isDevelopment ? '24h' : '60s'
    });
    const expiresAt = new Date(Date.now() + expirationTime).toISOString();

    return {
      token,
      expiresAt,
      telegramId,
    };
  }

  /**
   * Validates a JWT token and extracts the Telegram ID
   */
  validateToken(token: string): { telegramId: number } | null {
    try {
      const payload = this.jwtService.verify(token);
      return { telegramId: payload.telegramId };
    } catch (error) {
      return null;
    }
  }

  /**
   * Authenticates a user with a JWT token and creates/retrieves a survey session
   */
  async authenticateAndCreateSession(
    token: string,
    surveyType: SurveyType,
  ): Promise<{ session: SurveySession; sessionToken: string }> {
    const authData = this.validateToken(token);
    if (!authData) {
      throw new UnauthorizedException("Invalid or expired token");
    }

    const { telegramId } = authData;

    // Check if user has an existing in-progress session
    const canStartNew = await this.surveyService.canStartNewSurvey(telegramId);

    let session: SurveySession;
    if (canStartNew) {
      // Create new session
      session = await this.surveyService.createNewSession(
        telegramId,
        surveyType,
      );
    } else {
      // Get existing session (for resume functionality)
      // For now, we'll create a new session - in production, you'd want to retrieve the existing one
      session = await this.surveyService.createNewSession(
        telegramId,
        surveyType,
      );
    }

    // Generate a longer-lived session token for API calls
    const sessionToken = this.jwtService.sign(
      {
        telegramId,
        sessionId: session.id,
        type: "session",
      },
      { expiresIn: "24h" },
    );

    return { session, sessionToken };
  }

  /**
   * Validates a session token and extracts session information
   */
  validateSessionToken(
    token: string,
  ): { telegramId: number; sessionId: string } | null {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== "session") {
        return null;
      }
      return {
        telegramId: payload.telegramId,
        sessionId: payload.sessionId,
      };
    } catch (error) {
      return null;
    }
  }
}
