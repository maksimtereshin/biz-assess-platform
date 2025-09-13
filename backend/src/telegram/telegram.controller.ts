import { Controller, Post, Body, Get, Logger } from "@nestjs/common";
import { TelegramService } from "./telegram.service";
import { TelegramWebhookPayload } from "bizass-shared";

@Controller("telegram")
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private readonly telegramService: TelegramService) {}

  @Post("webhook")
  async handleWebhook(@Body() payload: TelegramWebhookPayload) {
    this.logger.log('Received webhook payload:', JSON.stringify(payload, null, 2));
    return this.telegramService.handleWebhook(payload);
  }

  @Get("bot-info")
  async getBotInfo() {
    return this.telegramService.getBotInfo();
  }
}
