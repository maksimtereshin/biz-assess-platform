import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class WebhookVerificationGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secretToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');

    if (!secretToken) {
      throw new UnauthorizedException('Telegram bot token not configured');
    }

    // Get the secret hash from headers
    const telegramHash = request.headers['x-telegram-bot-api-secret-token'];

    if (!telegramHash) {
      throw new UnauthorizedException('Missing Telegram signature');
    }

    // Create expected hash
    const rawBody = JSON.stringify(request.body);
    const expectedHash = crypto
      .createHmac('sha256', secretToken)
      .update(rawBody)
      .digest('hex');

    // Compare hashes in constant time to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(telegramHash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid Telegram signature');
    }

    return true;
  }
}