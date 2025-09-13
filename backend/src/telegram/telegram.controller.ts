import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { TelegramService } from "./telegram.service";
import { TelegramWebhookPayload } from "bizass-shared";
import { WebhookVerificationGuard } from "./guards/webhook-verification.guard";

@Controller("telegram")
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post("webhook")
  @UseGuards(WebhookVerificationGuard)
  async handleWebhook(@Body() payload: TelegramWebhookPayload) {
    return this.telegramService.handleWebhook(payload);
  }
}
