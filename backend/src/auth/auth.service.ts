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
    console.log('🔐 Starting Telegram authentication...');
    console.log('📱 Received initData length:', initData?.length || 0);
    console.log('📱 Raw initData (first 200 chars):', initData?.substring(0, 200));

    // Check if initData is empty or invalid
    if (!initData || initData.trim() === '') {
      console.error('❌ Empty or invalid initData received');
      throw new UnauthorizedException('Empty initData received');
    }

    try {
      // Parse initData
      const urlParams = new URLSearchParams(initData);
      console.log('📊 Parsed URL params count:', urlParams.size);

      // Log all parameters for debugging
      const params = {};
      for (const [key, value] of urlParams.entries()) {
        params[key] = value;
        console.log(`📄 Param ${key}:`, value);
      }

      const hash = urlParams.get('hash');
      console.log('🔗 Hash from initData:', hash);
      urlParams.delete('hash');

      // Check if hash exists
      if (!hash) {
        console.error('❌ No hash provided in initData');
        throw new UnauthorizedException('No hash provided in initData');
      }

      // Get bot token from environment
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      console.log('🤖 Bot token configured:', !!botToken);
      console.log('🤖 Bot token length:', botToken?.length || 0);

      if (!botToken) {
        console.error('❌ Bot token not configured');
        throw new UnauthorizedException('Bot token not configured');
      }

      // Create data string for verification
      const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      console.log('📝 Data check string:', dataCheckString);

      // Create secret key from bot token
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
      console.log('🔑 Secret key generated (length):', secretKey.length);

      // Calculate expected hash
      const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
      console.log('🔍 Expected hash:', expectedHash);
      console.log('🔍 Received hash:', hash);

      // Verify hash
      if (hash !== expectedHash) {
        console.error('❌ Hash verification failed!');
        console.error('❌ Expected:', expectedHash);
        console.error('❌ Received:', hash);
        throw new UnauthorizedException('Invalid Telegram initData signature');
      }

      console.log('✅ Hash verification successful!');

      // Parse user data
      const userParam = urlParams.get('user');
      console.log('👤 User param from initData:', userParam);

      if (!userParam) {
        console.error('❌ No user data in initData');
        throw new UnauthorizedException('No user data in initData');
      }

      const userData = JSON.parse(userParam);
      console.log('👤 Parsed user data:', userData);

      const telegramId = userData.id;
      console.log('🆔 Telegram ID:', telegramId);

      if (!telegramId) {
        console.error('❌ No user ID in Telegram data');
        throw new UnauthorizedException('No user ID in Telegram data');
      }

      // Generate auth token
      console.log('🎫 Generating auth token...');
      const authToken = this.generateAuthToken(telegramId);
      console.log('🎫 Auth token generated successfully');

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

      console.log('✅ Authentication successful for user:', telegramId);
      console.log('👤 Returning user object:', user);

      return {
        token: authToken.token,
        user
      };

    } catch (error) {
      console.error('❌ Telegram authentication error:', error);
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
    const expirationTime = isDevelopment ? 24 * 60 * 60 * 1000 : 5 * 60 * 1000; // 24 hours vs 5 minutes

    const token = this.jwtService.sign(payload, {
      expiresIn: isDevelopment ? '24h' : '5m'
    });
    const expiresAt = new Date(Date.now() + expirationTime).toISOString();

    return {
      token,
      expiresAt,
      telegramId,
    };
  }

  /**
   * Generates a JWT token for admin authentication
   * Used for automatic login to admin panel from Telegram bot
   * Token expires in 15 minutes (sufficient for transition from bot to admin panel)
   */
  generateAdminAuthToken(telegramUsername: string): string {
    const payload = {
      username: telegramUsername,
      role: 'admin',
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    return token;
  }

  /**
   * Validates an admin JWT token and extracts the username
   * Throws UnauthorizedException if token is invalid or expired
   */
  validateAdminToken(token: string): { username: string; role: string } {
    try {
      const payload = this.jwtService.verify(token);

      // Ensure token has admin role
      if (payload.role !== 'admin') {
        throw new UnauthorizedException('Token does not have admin role');
      }

      return {
        username: payload.username,
        role: payload.role,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired admin token');
    }
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
