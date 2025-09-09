import { Controller, Post, Body } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramWebhookPayload } from 'bizass-shared';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('webhook')
  async handleWebhook(@Body() payload: TelegramWebhookPayload) {
    return this.telegramService.handleWebhook(payload);
  }
}
