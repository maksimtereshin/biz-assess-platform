import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TelegramWebhookPayload, SurveyType } from "bizass-shared";
import { AuthService } from "../auth/auth.service";
import { SurveyService } from "../survey/survey.service";
import { PaymentService } from "../payment/payment.service";

interface InlineKeyboardMarkup {
  inline_keyboard: Array<
    Array<{
      text: string;
      callback_data?: string;
      web_app?: { url: string };
      pay?: boolean;
    }>
  >;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly webAppUrl: string;

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private surveyService: SurveyService,
    private paymentService: PaymentService,
  ) {
    this.botToken = this.configService.get<string>("TELEGRAM_BOT_TOKEN");
    this.webAppUrl = this.configService.get<string>(
      "FRONTEND_URL",
      "http://localhost:3000",
    );
  }

  private getMainKeyboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [{ text: "🚀 Начать ЧЕК АП", callback_data: "start_checkup" }],
        [{ text: "📊 Мои результаты", callback_data: "my_results" }],
        [{ text: "👥 Реферальная программа", callback_data: "referral" }],
        [{ text: "ℹ️ О проекте", callback_data: "about" }],
        [{ text: "❓ Помощь", callback_data: "help" }],
      ],
    };
  }

  private getSurveyTypeKeyboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          {
            text: "⚡ Экспресс версия (15 мин)",
            web_app: { url: `${this.webAppUrl}/express` },
          },
        ],
        [
          {
            text: "📈 Полная версия (20 мин)",
            web_app: { url: `${this.webAppUrl}/full` },
          },
        ],
        [{ text: "⬅️ Назад в главное меню", callback_data: "back_to_main" }],
      ],
    };
  }

  async handleWebhook(payload: TelegramWebhookPayload): Promise<void> {
    try {
      if (payload.message) {
        await this.handleMessage(payload.message);
      } else if (payload.callback_query) {
        await this.handleCallbackQuery(payload.callback_query);
      }
    } catch (error) {
      this.logger.error("Error handling webhook:", error);
      throw error;
    }
  }

  private async handleMessage(message: any): Promise<void> {
    const chatId = message.chat.id;
    const text = message.text;
    const user = message.from;

    this.logger.log(`Received message from ${user.id}: ${text}`);

    if (text?.startsWith("/start")) {
      await this.handleStartCommand(chatId, user);
    } else if (text?.startsWith("/help")) {
      await this.handleHelpCommand(chatId);
    } else if (text?.startsWith("/reports")) {
      await this.handleReportsCommand(chatId, user.id);
    } else if (text?.startsWith("/referral")) {
      await this.handleReferralCommand(chatId, user.id);
    } else {
      await this.sendMessage(
        chatId,
        "I don't understand that command. Use /help to see available commands.",
      );
    }
  }

  private async handleCallbackQuery(callbackQuery: any): Promise<void> {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const user = callbackQuery.from;

    this.logger.log(`Received callback query from ${user.id}: ${data}`);

    if (data === "start_checkup") {
      await this.handleStartCheckup(chatId);
    } else if (data === "my_results") {
      await this.handleReportsCommand(chatId, user.id);
    } else if (data === "referral") {
      await this.handleReferralCommand(chatId, user.id);
    } else if (data === "about") {
      await this.handleAboutCommand(chatId);
    } else if (data === "help") {
      await this.handleHelpCommand(chatId);
    } else if (data === "back_to_main") {
      await this.handleStartCommand(chatId, user);
    } else if (data.startsWith("survey_")) {
      const surveyType = data.split("_")[1] as SurveyType;
      await this.handleSurveySelection(chatId, user.id, surveyType);
    } else if (data.startsWith("report_free_")) {
      const sessionId = data.split("_")[2];
      await this.handleFreeReportRequest(chatId, user.id, sessionId);
    } else if (data.startsWith("report_paid_")) {
      const sessionId = data.split("_")[2];
      await this.handlePaidReportRequest(chatId, user.id, sessionId);
    } else if (data.startsWith("payment_")) {
      const sessionId = data.split("_")[1];
      await this.handlePaymentRequest(chatId, user.id, sessionId);
    } else if (data.startsWith("report_")) {
      const reportId = data.split("_")[1];
      await this.handleReportRequest(chatId, user.id, reportId);
    }

    // Answer the callback query to remove loading state
    await this.answerCallbackQuery(callbackQuery.id);
  }

  private async handleStartCommand(chatId: number, user: any): Promise<void> {
    const welcomeMessage = `
🎯 Добро пожаловать в ЧЕК АП Экспертный бизнес, ${user.first_name || "Friend"}!
  
Это профессиональный опросник для экспертов помогающих профессий.

✅ Всего 15-20 минут вашего времени
📊 Персональный отчет с результатами
🎯 Детальный план действий по выбранным категориям

Выберите действие из меню ниже:
    `;

    await this.sendMessageWithKeyboard(
      chatId,
      welcomeMessage,
      this.getMainKeyboard(),
    );
  }

  private async handleStartCheckup(chatId: number): Promise<void> {
    const message = `
🚀 *Выберите тип ЧЕК АПа*

*⚡ Экспресс версия (15 мин)*
• 25 ключевых вопросов
• Быстрая оценка основных сфер бизнеса
• Базовые рекомендации

*📈 Полная версия (20 мин)*
• 61 детальный вопрос
• Глубокий анализ всех аспектов
• Подробный план развития

Выберите подходящий вариант:
    `;

    await this.sendMessageWithKeyboard(
      chatId,
      message,
      this.getSurveyTypeKeyboard(),
    );
  }

  private async handleAboutCommand(chatId: number): Promise<void> {
    const aboutMessage = `
ℹ️ *О проекте ЧЕК АП Экспертный бизнес*

Это профессиональный инструмент для диагностики и развития бизнеса экспертов помогающих профессий.

*🎯 Наша миссия:*
Помочь экспертам построить устойчивый и прибыльный бизнес

*✨ Что вы получите:*
• Детальный анализ текущего состояния бизнеса
• Персональные рекомендации по развитию
• Конкретный план действий
• Выявление скрытых возможностей

*📊 Методология:*
Основана на проверенных бизнес-практиках и многолетнем опыте работы с экспертами

*👥 Для кого:*
Психологи, коучи, консультанты, тренеры и другие эксперты помогающих профессий

Готовы узнать больше о своем бизнесе? Нажмите "🚀 Начать ЧЕК АП"!
    `;

    await this.sendMessage(chatId, aboutMessage);
  }

  private async handleHelpCommand(chatId: number): Promise<void> {
    const helpMessage = `
*Business Assessment Platform - Help*

*Available Commands:*
/start - Start a new survey
/reports - View your survey history and download reports
/referral - Get your unique referral code to share with friends
/help - Show this help message

*Survey Types:*
• *Express Survey* - Quick 25-question assessment (5-10 minutes)
• *Full Survey* - Comprehensive 61-question assessment (15-20 minutes)

*How it works:*
1. Choose a survey type
2. Click the link to open the web survey
3. Answer questions one by one (auto-saved)
4. Get your free report instantly
5. Option to buy detailed analysis

Need more help? Contact support.
    `;

    await this.sendMessage(chatId, helpMessage);
  }

  private async handleReportsCommand(
    chatId: number,
    userId: number,
  ): Promise<void> {
    try {
      // Get user's survey sessions and reports
      const sessions = await this.surveyService.getUserSessions(userId);

      if (sessions.length === 0) {
        await this.sendMessage(
          chatId,
          "📊 You haven't completed any surveys yet. Use /start to begin your first assessment!",
        );
        return;
      }

      let message = "📊 *Your Survey Reports:*\n\n";

      for (const session of sessions) {
        const status =
          session.status === "COMPLETED" ? "✅ Completed" : "⏳ In Progress";
        const surveyType =
          session.survey?.type === "EXPRESS" ? "⚡ Express" : "📈 Full";
        const date = new Date(session.created_at).toLocaleDateString();

        message += `${surveyType} - ${status}\n`;
        message += `📅 ${date}\n`;

        if (session.status === "COMPLETED") {
          // Add download buttons for completed surveys
          const keyboard = {
            inline_keyboard: [
              [
                {
                  text: "📄 Download Free Report",
                  callback_data: `report_free_${session.id}`,
                },
              ],
              [
                {
                  text: "💎 Buy Full Report",
                  callback_data: `report_paid_${session.id}`,
                },
              ],
            ],
          };

          await this.sendMessageWithKeyboard(chatId, message, keyboard);
          message = ""; // Reset for next session
        } else {
          message += `🔗 [Continue Survey](${this.webAppUrl}/survey?session=${session.id})\n\n`;
        }
      }

      if (message.trim()) {
        await this.sendMessage(chatId, message);
      }
    } catch (error) {
      this.logger.error("Error fetching reports:", error);
      await this.sendMessage(
        chatId,
        "Sorry, there was an error fetching your reports. Please try again later.",
      );
    }
  }

  private async handleReferralCommand(
    chatId: number,
    userId: number,
  ): Promise<void> {
    // TODO: Implement referral code generation
    const referralCode = `REF${userId}`;
    const referralMessage = `
🎁 *Your Referral Code: ${referralCode}*

Share this code with friends to earn rewards!

*How it works:*
• Share your code with friends
• When they complete their first survey, you both get benefits
• Track your referrals in your reports

*Your referral link:*
https://t.me/your_bot?start=ref_${referralCode}
    `;

    await this.sendMessage(chatId, referralMessage);
  }

  private async handleSurveySelection(
    chatId: number,
    userId: number,
    surveyType: SurveyType,
  ): Promise<void> {
    try {
      // Generate authentication token
      const authToken = this.authService.generateAuthToken(userId);

      // Create survey link with the specific survey type path
      const surveyPath = surveyType === SurveyType.EXPRESS ? "express" : "full";
      const surveyUrl = `${this.webAppUrl}/${surveyPath}?token=${authToken.token}`;

      const message = `
🎯 *${surveyType === SurveyType.EXPRESS ? "Express" : "Full"} Survey Selected*

Click the link below to start your business assessment:

[🚀 Start Survey](${surveyUrl})

*What to expect:*
• ${surveyType === SurveyType.EXPRESS ? "25 questions" : "61 questions"} across key business areas  
• Auto-save progress (you can pause and resume)
• Instant free report upon completion
• Option to purchase detailed analysis

*Note:* This link is valid for 60 seconds for security.
      `;

      await this.sendMessage(chatId, message);
    } catch (error) {
      this.logger.error("Error generating survey link:", error);
      await this.sendMessage(
        chatId,
        "Sorry, there was an error generating your survey link. Please try again.",
      );
    }
  }

  private async handleFreeReportRequest(
    chatId: number,
    userId: number,
    sessionId: string,
  ): Promise<void> {
    try {
      // Generate free report
      const report = await this.surveyService.generateReport(sessionId, false);

      const message = `
📄 *Free Report Generated!*

Your business assessment report is ready for download.

*Report includes:*
• Overall business score
• Category performance summary
• Key recommendations
• Basic insights

[📥 Download Free Report](${this.webAppUrl}/reports/download/${report.id})

*Want more details?* Use the "Buy Full Report" button for comprehensive analysis with subcategory breakdowns and detailed action plans.
      `;

      await this.sendMessage(chatId, message);
    } catch (error) {
      this.logger.error("Error generating free report:", error);
      await this.sendMessage(
        chatId,
        "Sorry, there was an error generating your report. Please try again later.",
      );
    }
  }

  private async handlePaidReportRequest(
    chatId: number,
    userId: number,
    sessionId: string,
  ): Promise<void> {
    try {
      // Check if user already has a paid report for this session
      const existingReport = await this.surveyService.getPaidReport(sessionId);

      if (existingReport) {
        const message = `
💎 *Full Report Available!*

You already have a full report for this survey.

[📥 Download Full Report](${this.webAppUrl}/reports/download/${existingReport.id})
        `;
        await this.sendMessage(chatId, message);
        return;
      }

      // Initiate payment flow
      const message = `
💎 *Upgrade to Full Report*

Get comprehensive insights with:
• Detailed subcategory analysis
• Advanced recommendations
• Action plans for improvement
• Priority areas to focus on

*Price: $9.99*

Click the button below to purchase:
      `;

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "💳 Buy Full Report - $9.99",
              callback_data: `payment_${sessionId}`,
            },
          ],
        ],
      };

      await this.sendMessageWithKeyboard(chatId, message, keyboard);
    } catch (error) {
      this.logger.error("Error handling paid report request:", error);
      await this.sendMessage(
        chatId,
        "Sorry, there was an error processing your request. Please try again later.",
      );
    }
  }

  private async handlePaymentRequest(
    chatId: number,
    userId: number,
    sessionId: string,
  ): Promise<void> {
    try {
      // Create payment invoice
      const paymentData = await this.paymentService.createPayment(
        userId,
        sessionId,
      );

      const message = `
💳 *Payment Invoice Created*

Your payment invoice has been generated. Please complete the payment to receive your full report.

*What you'll get:*
• Detailed subcategory analysis
• Advanced recommendations  
• Action plans for improvement
• Priority areas to focus on

Click the button below to pay:
      `;

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "💳 Pay $9.99",
              pay: true,
            },
          ],
        ],
      };

      // Send invoice message
      await this.sendInvoice(chatId, message, paymentData.invoice, keyboard);
    } catch (error) {
      this.logger.error("Error creating payment:", error);
      await this.sendMessage(
        chatId,
        "Sorry, there was an error creating your payment. Please try again later.",
      );
    }
  }

  private async handleReportRequest(
    chatId: number,
    _userId: number,
    _reportId: string,
  ): Promise<void> {
    // Legacy method for backward compatibility
    await this.sendMessage(
      chatId,
      "📄 Report download functionality is now available through the /reports command!",
    );
  }

  async sendMessage(chatId: number, text: string): Promise<void> {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: "Markdown",
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
      }
    } catch (error) {
      this.logger.error("Error sending message:", error);
      throw error;
    }
  }

  async sendMessageWithKeyboard(
    chatId: number,
    text: string,
    keyboard: any,
  ): Promise<void> {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: "Markdown",
            reply_markup: keyboard,
          }),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error("Telegram API error response:", errorBody);
        throw new Error(
          `Telegram API error: ${response.statusText} - ${errorBody}`,
        );
      }
    } catch (error) {
      this.logger.error("Error sending message with keyboard:", error);
      throw error;
    }
  }

  async answerCallbackQuery(callbackQueryId: string): Promise<void> {
    try {
      await fetch(
        `https://api.telegram.org/bot${this.botToken}/answerCallbackQuery`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            callback_query_id: callbackQueryId,
          }),
        },
      );
    } catch (error) {
      this.logger.error("Error answering callback query:", error);
    }
  }

  async sendInvoice(
    chatId: number,
    text: string,
    invoice: any,
    keyboard: any,
  ): Promise<void> {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/sendInvoice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            title: invoice.title,
            description: invoice.description,
            payload: invoice.payload,
            provider_token: invoice.provider_token,
            currency: invoice.currency,
            prices: invoice.prices,
            reply_markup: keyboard,
          }),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error("Telegram Invoice API error response:", errorBody);
        throw new Error(
          `Telegram Invoice API error: ${response.statusText} - ${errorBody}`,
        );
      }
    } catch (error) {
      this.logger.error("Error sending invoice:", error);
      throw error;
    }
  }

  async generateSurveyLink(
    telegramId: number,
    surveyType: SurveyType,
  ): Promise<string> {
    const authToken = this.authService.generateAuthToken(telegramId);
    return `${this.webAppUrl}/survey?token=${authToken.token}&type=${surveyType}`;
  }
}
