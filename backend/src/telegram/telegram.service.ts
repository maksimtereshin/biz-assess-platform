import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TelegramWebhookPayload, SurveyType } from "bizass-shared";
import { AuthService } from "../auth/auth.service";
import { SurveyService } from "../survey/survey.service";
import { PaymentService } from "../payment/payment.service";
import { AnalyticsService } from "../analytics/analytics.service";
import { ExcelService } from "../excel/excel.service";
import { ReportService } from "../report/report.service";
import { User } from "../entities";
import { ADMIN_USERNAMES, ADMIN_PANEL } from "./telegram.constants";
import { CalendarService } from "./calendar/calendar.service";
import * as fs from "fs";
import * as FormData from "form-data";
import axios from "axios";

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

  // Store calendar selection state per user
  private readonly calendarState = new Map<number, {
    startDate?: Date;
    endDate?: Date;
    currentViewDate: Date;
  }>();

  // Rate limiting for report generation (1 per minute per admin)
  private readonly reportGenerationCooldown = new Map<number, number>();
  private readonly REPORT_COOLDOWN_MS = 60000; // 1 minute
  private readonly REPORT_TIMEOUT_MS = 30000; // 30 seconds

  // Rate limiting for PDF report downloads (1 per minute per user)
  private readonly pdfDownloadCooldown = new Map<number, number>();
  private readonly PDF_DOWNLOAD_COOLDOWN_MS = 60000; // 1 minute

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private surveyService: SurveyService,
    private paymentService: PaymentService,
    private analyticsService: AnalyticsService,
    private excelService: ExcelService,
    private calendarService: CalendarService,
    private reportService: ReportService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    this.botToken = this.configService.get<string>("TELEGRAM_BOT_TOKEN");
    this.webAppUrl = this.configService.get<string>(
      "FRONTEND_URL",
      "http://localhost:3000",
    );
  }

  /**
   * Check if a username belongs to an authorized admin
   * Performs case-insensitive matching and trims whitespace
   * @param username - Telegram username to check
   * @returns true if user is admin, false otherwise
   */
  isAdmin(username?: string | null): boolean {
    if (!username) {
      return false;
    }

    const normalizedUsername = username.trim().toLowerCase();
    const isAdminUser = ADMIN_USERNAMES.some(
      (adminUsername) => adminUsername.toLowerCase() === normalizedUsername
    );

    if (isAdminUser) {
      this.logger.log(`Admin access granted for username: ${username}`);
    }

    return isAdminUser;
  }

  getMainKeyboard(user?: { username?: string }): InlineKeyboardMarkup {
    const baseKeyboard = [
      [{ text: "🚀 Начать ЧЕК АП", callback_data: "start_checkup" }],
      [{ text: "📊 Мои результаты", callback_data: "my_results" }],
      [{ text: "👥 Реферальная программа", callback_data: "referral" }],
      [{ text: "ℹ️ О проекте", callback_data: "about" }],
      [{ text: "❓ Помощь", callback_data: "help" }],
    ];

    // Add admin button for authorized users
    if (user?.username && this.isAdmin(user.username)) {
      baseKeyboard.push([
        { text: ADMIN_PANEL.BUTTON_TEXT, callback_data: "admin_panel" },
      ]);
    }

    return {
      inline_keyboard: baseKeyboard,
    };
  }

  private getSurveyTypeKeyboard(telegramId?: number): InlineKeyboardMarkup {
    // Генерируем токен для авторизации если есть telegramId
    let authToken = '';
    if (telegramId) {
      try {
        const token = this.authService.generateAuthToken(telegramId);
        authToken = `?token=${token.token}`;
        console.log('🎫 Generated auth token for user:', telegramId);
      } catch (error) {
        console.warn('⚠️ Failed to generate auth token:', error);
      }
    }

    return {
      inline_keyboard: [
        [
          {
            text: "⚡ Экспресс версия (15 мин)",
            web_app: { url: `${this.webAppUrl}/express${authToken}` },
          },
        ],
        [
          {
            text: "📈 Полная версия (20 мин)",
            web_app: { url: `${this.webAppUrl}/full${authToken}` },
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

  /**
   * Ensures user exists in database, creates if not exists, updates if exists
   */
  private async ensureUserExists(
    telegramId: number,
    firstName: string,
    username?: string,
  ): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { telegram_id: telegramId },
    });

    if (!user) {
      // Create new user
      this.logger.log(`Creating new user: ${telegramId}`);
      user = this.userRepository.create({
        telegram_id: telegramId,
        first_name: firstName,
        username: username,
      });
      await this.userRepository.save(user);
      this.logger.log(`User created successfully: ${telegramId}`);
    } else {
      // Update existing user data if changed
      let needsUpdate = false;
      if (user.first_name !== firstName) {
        user.first_name = firstName;
        needsUpdate = true;
      }
      if (user.username !== username) {
        user.username = username;
        needsUpdate = true;
      }
      if (needsUpdate) {
        this.logger.log(`Updating user data: ${telegramId}`);
        await this.userRepository.save(user);
      }
    }

    return user;
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
    } else if (data === "admin_panel" || data.startsWith("analytics_")) {
      // Admin-only features - check authorization
      if (!this.isAdmin(user.username)) {
        this.logger.warn(`Unauthorized admin access attempt by user: ${user.username || user.id}`);
        await this.sendMessage(
          chatId,
          "⛔ Вы не авторизованы для доступа к админ панели.",
        );
        return;
      }

      if (data === "admin_panel") {
        await this.handleAdminPanel(chatId);
      } else if (data === "analytics_all_time") {
        await this.sendMessage(chatId, "📊 Генерация отчета за весь период...\n\n⏳ Пожалуйста, подождите...");
        await this.generateAndSendAnalyticsReport(chatId, user.id, null, null);
      } else if (data === "analytics_custom") {
        await this.handleCalendarStart(chatId, user.id);
      }
    } else if (data.startsWith("calendar_")) {
      // Calendar widget callbacks - admin only
      if (!this.isAdmin(user.username)) {
        this.logger.warn(`Unauthorized calendar access attempt by user: ${user.username || user.id}`);
        await this.sendMessage(chatId, "⛔ Вы не авторизованы для доступа к этой функции.");
        return;
      }
      await this.handleCalendarCallback(chatId, user.id, data, callbackQuery.message.message_id);
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
    } else if (data.startsWith("download_report_")) {
      const sessionId = data.replace("download_report_", "");
      await this.handleReportDownload(chatId, user.id, sessionId);
    } else if (data.startsWith("report_")) {
      const reportId = data.split("_")[1];
      await this.handleReportRequest(chatId, user.id, reportId);
    }

    // Answer the callback query to remove loading state
    await this.answerCallbackQuery(callbackQuery.id);
  }

  private async handleStartCommand(chatId: number, user: any): Promise<void> {
    // Ensure user exists in database
    await this.ensureUserExists(user.id, user.first_name, user.username);

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
      this.getMainKeyboard(user),
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
      this.getSurveyTypeKeyboard(chatId),
    );
  }

  private async handleAdminPanel(chatId: number): Promise<void> {
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: ADMIN_PANEL.ALL_TIME_ANALYTICS,
            callback_data: "analytics_all_time",
          },
        ],
        [
          {
            text: ADMIN_PANEL.CUSTOM_ANALYTICS,
            callback_data: "analytics_custom",
          },
        ],
        [
          {
            text: ADMIN_PANEL.BACK_TO_MAIN,
            callback_data: "back_to_main",
          },
        ],
      ],
    };

    await this.sendMessageWithKeyboard(
      chatId,
      ADMIN_PANEL.MENU_TITLE,
      keyboard,
    );
  }

  /**
   * Initialize calendar for date range selection
   */
  private async handleCalendarStart(chatId: number, userId: number): Promise<void> {
    // Initialize calendar state
    const today = new Date();
    this.calendarState.set(userId, {
      currentViewDate: today,
    });

    const message = `
📅 *Выбор периода для аналитики*

Выберите начальную дату периода.
После выбора начальной даты, выберите конечную дату.

_Максимальный период: 1 год_
    `;

    const calendar = this.calendarService.generateCalendar(today);

    await this.sendMessageWithKeyboard(chatId, message, calendar);
  }

  /**
   * Handle calendar navigation and date selection
   */
  private async handleCalendarCallback(
    chatId: number,
    userId: number,
    callbackData: string,
    messageId: number,
  ): Promise<void> {
    const state = this.calendarState.get(userId) || { currentViewDate: new Date() };
    const parsed = this.calendarService.parseCallbackData(callbackData);

    switch (parsed.action) {
      case 'prev_month': {
        const { year, month } = this.calendarService.getPreviousMonth(
          parsed.year!,
          parsed.month!,
        );
        state.currentViewDate = new Date(year, month, 1);
        this.calendarState.set(userId, state);

        const calendar = this.calendarService.generateCalendarWithSelection(
          state.currentViewDate,
          state.startDate,
          state.endDate,
        );

        await this.editMessageKeyboard(chatId, messageId, calendar);
        break;
      }

      case 'next_month': {
        const { year, month } = this.calendarService.getNextMonth(
          parsed.year!,
          parsed.month!,
        );
        state.currentViewDate = new Date(year, month, 1);
        this.calendarState.set(userId, state);

        const calendar = this.calendarService.generateCalendarWithSelection(
          state.currentViewDate,
          state.startDate,
          state.endDate,
        );

        await this.editMessageKeyboard(chatId, messageId, calendar);
        break;
      }

      case 'select': {
        const selectedDate = parsed.date!;

        if (!state.startDate) {
          // First selection - set as start date
          state.startDate = selectedDate;
          state.endDate = undefined;

          const message = `
📅 *Выбор периода для аналитики*

✅ Начальная дата: ${this.formatDateRussian(selectedDate)}

Теперь выберите конечную дату периода.
          `;

          const calendar = this.calendarService.generateCalendarWithSelection(
            state.currentViewDate,
            state.startDate,
          );

          await this.editMessageWithKeyboard(chatId, messageId, message, calendar);
        } else if (!state.endDate) {
          // Second selection - set as end date
          state.endDate = selectedDate;

          // Validate date range
          const validation = this.calendarService.validateDateRange(
            state.startDate,
            state.endDate,
          );

          if (!validation.valid) {
            await this.sendMessage(chatId, `❌ ${validation.error}`);
            // Reset selection
            state.startDate = undefined;
            state.endDate = undefined;

            const calendar = this.calendarService.generateCalendar(state.currentViewDate);
            await this.editMessageKeyboard(chatId, messageId, calendar);
            return;
          }

          const message = `
📅 *Выбор периода для аналитики*

✅ Начальная дата: ${this.formatDateRussian(state.startDate)}
✅ Конечная дата: ${this.formatDateRussian(state.endDate)}

Нажмите "Подтвердить выбор" для генерации отчета.
          `;

          const calendar = this.calendarService.generateCalendarWithSelection(
            state.currentViewDate,
            state.startDate,
            state.endDate,
          );

          await this.editMessageWithKeyboard(chatId, messageId, message, calendar);
        } else {
          // Both dates already selected - reset and start over
          state.startDate = selectedDate;
          state.endDate = undefined;

          const message = `
📅 *Выбор периода для аналитики*

✅ Начальная дата: ${this.formatDateRussian(selectedDate)}

Теперь выберите конечную дату периода.
          `;

          const calendar = this.calendarService.generateCalendarWithSelection(
            state.currentViewDate,
            state.startDate,
          );

          await this.editMessageWithKeyboard(chatId, messageId, message, calendar);
        }

        this.calendarState.set(userId, state);
        break;
      }

      case 'confirm': {
        if (!state.startDate || !state.endDate) {
          await this.sendMessage(chatId, '❌ Ошибка: Не выбраны даты');
          return;
        }

        // Clear calendar state
        this.calendarState.delete(userId);

        const message = `
📊 *Генерация отчета за период*

📅 С ${this.formatDateRussian(state.startDate)} по ${this.formatDateRussian(state.endDate)}

⏳ Пожалуйста, подождите...

_Генерация отчета может занять до 30 секунд_
        `;

        await this.sendMessage(chatId, message);
        this.logger.log(
          `Confirmed date range: ${state.startDate.toISOString()} to ${state.endDate.toISOString()}`,
        );

        // Generate and send analytics report
        await this.generateAndSendAnalyticsReport(chatId, userId, state.startDate, state.endDate);
        break;
      }

      case 'cancel': {
        this.calendarState.delete(userId);
        await this.sendMessage(chatId, '❌ Выбор периода отменен');
        await this.handleAdminPanel(chatId);
        break;
      }

      case 'noop':
      default:
        // Do nothing
        break;
    }
  }

  /**
   * Format date in Russian format: DD.MM.YYYY
   */
  private formatDateRussian(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  /**
   * Check if user can generate a report (rate limiting)
   */
  private canGenerateReport(userId: number): boolean {
    const lastRequest = this.reportGenerationCooldown.get(userId);
    if (!lastRequest) return true;

    const now = Date.now();
    const timeSinceLastRequest = now - lastRequest;

    return timeSinceLastRequest >= this.REPORT_COOLDOWN_MS;
  }

  /**
   * Get remaining cooldown time in seconds
   */
  private getRemainingCooldown(userId: number): number {
    const lastRequest = this.reportGenerationCooldown.get(userId);
    if (!lastRequest) return 0;

    const now = Date.now();
    const timeSinceLastRequest = now - lastRequest;
    const remaining = this.REPORT_COOLDOWN_MS - timeSinceLastRequest;

    return Math.ceil(remaining / 1000);
  }

  /**
   * Check if user can download a PDF report (rate limiting)
   */
  private canDownloadPdfReport(userId: number): boolean {
    const lastRequest = this.pdfDownloadCooldown.get(userId);
    if (!lastRequest) return true;

    const now = Date.now();
    const timeSinceLastRequest = now - lastRequest;

    return timeSinceLastRequest >= this.PDF_DOWNLOAD_COOLDOWN_MS;
  }

  /**
   * Get remaining PDF download cooldown time in seconds
   */
  private getRemainingPdfDownloadCooldown(userId: number): number {
    const lastRequest = this.pdfDownloadCooldown.get(userId);
    if (!lastRequest) return 0;

    const now = Date.now();
    const timeSinceLastRequest = now - lastRequest;
    const remaining = this.PDF_DOWNLOAD_COOLDOWN_MS - timeSinceLastRequest;

    return Math.ceil(remaining / 1000);
  }

  /**
   * Generate analytics report and send as Excel file
   */
  private async generateAndSendAnalyticsReport(
    chatId: number,
    userId: number,
    startDate: Date | null = null,
    endDate: Date | null = null,
  ): Promise<void> {
    // Check rate limiting
    if (!this.canGenerateReport(userId)) {
      const remainingSeconds = this.getRemainingCooldown(userId);
      await this.sendMessage(
        chatId,
        `⏳ Пожалуйста, подождите еще ${remainingSeconds} секунд перед следующим запросом отчета.`,
      );
      return;
    }

    // Update rate limiting
    this.reportGenerationCooldown.set(userId, Date.now());

    let filePath: string | null = null;

    try {
      // Set timeout for report generation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Report generation timeout')), this.REPORT_TIMEOUT_MS);
      });

      const reportPromise = this.generateReport(startDate, endDate);

      filePath = await Promise.race([reportPromise, timeoutPromise]) as string;

      // Send file to user
      await this.sendDocument(chatId, filePath, 'Аналитический_отчет.xlsx');

      // Success message
      await this.sendMessage(
        chatId,
        '✅ Отчет успешно сгенерирован и отправлен!',
      );

      this.logger.log(`Analytics report generated successfully for user ${userId}`);
    } catch (error) {
      this.logger.error('Error generating analytics report:', error);

      if (error.message === 'Report generation timeout') {
        await this.sendMessage(
          chatId,
          '⏱️ Превышено время ожидания генерации отчета (30 секунд). Пожалуйста, попробуйте позже.',
        );
      } else {
        await this.sendMessage(
          chatId,
          '❌ Ошибка при генерации отчета. Пожалуйста, попробуйте позже или обратитесь к администратору.',
        );
      }
    } finally {
      // Clean up temp file
      if (filePath) {
        try {
          await this.excelService.deleteReportFile(filePath);
        } catch (cleanupError) {
          this.logger.warn('Error deleting temp report file:', cleanupError);
        }
      }
    }
  }

  /**
   * Generate analytics report data and Excel file
   */
  private async generateReport(
    startDate: Date | null,
    endDate: Date | null,
  ): Promise<string> {
    // Gather all analytics data
    const [
      totalUsers,
      newUsers,
      userGrowthRate,
      expressStats,
      fullStats,
      expressConversion,
      fullConversion,
      expressAvgTime,
      fullAvgTime,
      expressAvgScore,
      fullAvgScore,
      paidRetakes,
      totalRevenue,
      periodRevenue,
      avgRevenuePerUser,
      paymentConversionRate,
      topUsers,
    ] = await Promise.all([
      this.analyticsService.getTotalUsers(),
      this.analyticsService.getNewUsers(startDate, endDate),
      startDate && endDate
        ? this.analyticsService.getUserGrowthRate(startDate, endDate)
        : Promise.resolve(0),
      this.analyticsService.getSurveyStats('express', startDate, endDate),
      this.analyticsService.getSurveyStats('full', startDate, endDate),
      this.analyticsService.getConversionRate('express', startDate, endDate),
      this.analyticsService.getConversionRate('full', startDate, endDate),
      this.analyticsService.getAverageCompletionTime('express'),
      this.analyticsService.getAverageCompletionTime('full'),
      this.analyticsService.getAverageScores('express', startDate, endDate),
      this.analyticsService.getAverageScores('full', startDate, endDate),
      this.analyticsService.getPaidRetakes(startDate, endDate),
      this.analyticsService.getTotalRevenue(),
      startDate && endDate
        ? this.analyticsService.getPeriodRevenue(startDate, endDate)
        : this.analyticsService.getTotalRevenue(),
      this.analyticsService.getAverageRevenuePerUser(),
      this.analyticsService.getPaymentConversionRate(),
      this.analyticsService.getUsersWithMostCompletions(20),
    ]);

    // Build report object
    const report = {
      userStats: {
        totalUsers,
        newUsers,
        userGrowthRate,
      },
      surveyStats: [
        {
          type: 'express',
          started: expressStats.started,
          completed: expressStats.completed,
          conversionRate: expressConversion,
          averageCompletionTime: expressAvgTime,
          averageScore: expressAvgScore,
        },
        {
          type: 'full',
          started: fullStats.started,
          completed: fullStats.completed,
          conversionRate: fullConversion,
          averageCompletionTime: fullAvgTime,
          averageScore: fullAvgScore,
        },
      ],
      financialMetrics: {
        paidRetakes,
        totalRevenue,
        periodRevenue,
        averageRevenuePerUser: avgRevenuePerUser,
        paymentConversionRate,
      },
      topUsers,
      generatedAt: new Date(),
      dateRange: {
        startDate,
        endDate,
      },
    };

    // Generate Excel file
    const filePath = await this.excelService.generateAnalyticsReport(report);

    return filePath;
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
      // Get user's completed survey sessions
      const sessions = await this.surveyService.getUserSessions(userId);
      const completedSessions = sessions.filter(s => s.status === 'COMPLETED');

      if (completedSessions.length === 0) {
        await this.sendMessage(
          chatId,
          "📊 У вас пока нет завершенных опросов.\n\nИспользуйте /start чтобы начать свой первый ЧЕК АП!",
        );
        return;
      }

      // Build indexed list message
      let message = "📊 *Ваши результаты ЧЕК АПа:*\n\n";
      const buttons: Array<Array<{ text: string; callback_data: string }>> = [];

      completedSessions.forEach((session, index) => {
        const surveyType = session.survey?.type === "EXPRESS" ? "express" : "full";
        const date = new Date(session.created_at).toLocaleDateString('ru-RU', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });

        // Format: "1. express-2025-10-08"
        const listItem = `${index + 1}. ${surveyType}-${date.split('.').reverse().join('-')}`;
        message += `${listItem}\n`;

        // Add download button for this result
        buttons.push([
          {
            text: `📥 Скачать отчет #${index + 1}`,
            callback_data: `download_report_${session.id}`,
          },
        ]);
      });

      message += "\n_Нажмите на кнопку, чтобы скачать PDF отчет_";

      const keyboard = {
        inline_keyboard: buttons,
      };

      await this.sendMessageWithKeyboard(chatId, message, keyboard);
    } catch (error) {
      this.logger.error("Error fetching reports:", error);
      await this.sendMessage(
        chatId,
        "Извините, произошла ошибка при получении ваших результатов. Пожалуйста, попробуйте позже.",
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

  /**
   * Handles PDF report download requests from users
   * Implements rate limiting, ownership validation, and free/paid logic
   */
  private async handleReportDownload(
    chatId: number,
    userId: number,
    sessionId: string,
  ): Promise<void> {
    try {
      this.logger.log(`User ${userId} requesting report download for session ${sessionId}`);

      // Check rate limiting
      if (!this.canDownloadPdfReport(userId)) {
        const remainingSeconds = this.getRemainingPdfDownloadCooldown(userId);
        await this.sendMessage(
          chatId,
          `⏳ Пожалуйста, подождите еще ${remainingSeconds} секунд перед следующим запросом отчета.`,
        );
        return;
      }

      // Send initial status message
      await this.sendMessage(
        chatId,
        "📄 Генерация PDF отчета...\n\n⏳ Это может занять несколько секунд.",
      );

      // 1. Validate session ownership
      const session = await this.surveyService.getSession(sessionId);

      // Convert both to numbers for comparison (bigint from DB might be returned as string)
      const sessionUserId = typeof session.userId === 'string' ? parseInt(session.userId, 10) : session.userId;

      if (sessionUserId !== userId) {
        this.logger.warn(`User ${userId} attempted to access session ${sessionId} owned by ${sessionUserId} (original: ${session.userId}, type: ${typeof session.userId})`);
        await this.sendMessage(
          chatId,
          "⛔ У вас нет доступа к этому отчету.",
        );
        return;
      }

      // 2. Determine if report should be free or paid
      const completedSessions = await this.surveyService.getUserSessions(userId);
      const completedCount = completedSessions.filter(s => s.status === 'COMPLETED').length;
      const isFree = completedCount === 1;

      this.logger.log(`User ${userId} has ${completedCount} completed sessions. Report is ${isFree ? 'FREE' : 'PAID'}`);

      // 3. If paid and not yet paid, initiate payment flow
      if (!isFree) {
        await this.sendMessage(
          chatId,
          "💎 *Оплата требуется*\n\nВаш первый отчет был бесплатным. Для получения последующих отчетов необходима оплата.\n\n*Стоимость: 299 руб*\n\nФункция оплаты будет добавлена в следующем обновлении.",
        );
        return;
      }

      // Update rate limiting
      this.pdfDownloadCooldown.set(userId, Date.now());

      // 4. Generate PDF report

      // 4. Generate PDF report (returns Buffer)
      const pdfBuffer = await this.reportService.generateReport(sessionId, !isFree);

      // 5. Send PDF via Telegram using buffer
      const fileName = `report_${sessionId}.pdf`;
      const caption = isFree
        ? '📄 Ваш бесплатный отчет готов!'
        : '💎 Ваш полный отчет готов!';

      // Send PDF buffer directly
      await this.sendDocumentFromBuffer(chatId, pdfBuffer, fileName, caption);

      await this.sendMessage(
        chatId,
        "✅ Отчет успешно сгенерирован и отправлен!",
      );

      this.logger.log(`Successfully generated and sent report for session ${sessionId} to user ${userId}`);
    } catch (error) {
      this.logger.error("Error handling report download:", error);

      // Provide user-friendly error messages
      if (error.message?.includes('not found')) {
        await this.sendMessage(
          chatId,
          "❌ Опрос не найден. Пожалуйста, убедитесь, что вы завершили опрос.",
        );
      } else if (error.message?.includes('Session not found')) {
        await this.sendMessage(
          chatId,
          "❌ Опрос не найден. Пожалуйста, убедитесь, что вы завершили опрос.",
        );
      } else {
        await this.sendMessage(
          chatId,
          "❌ Ошибка при генерации отчета. Пожалуйста, попробуйте позже.",
        );
      }
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

  async editMessageWithKeyboard(
    chatId: number,
    messageId: number,
    text: string,
    keyboard: any,
  ): Promise<void> {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/editMessageText`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
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
      this.logger.error("Error editing message with keyboard:", error);
      throw error;
    }
  }

  async editMessageKeyboard(
    chatId: number,
    messageId: number,
    keyboard: any,
  ): Promise<void> {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/editMessageReplyMarkup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
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
      this.logger.error("Error editing message keyboard:", error);
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

  async sendDocument(
    chatId: number,
    filePath: string,
    fileName: string,
    caption?: string,
  ): Promise<void> {
    try {
      const formData = new FormData();

      formData.append('chat_id', chatId.toString());
      formData.append('document', fs.createReadStream(filePath), {
        filename: fileName,
        contentType: fileName.endsWith('.pdf')
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      if (caption) {
        formData.append('caption', caption);
      } else {
        formData.append('caption', fileName.endsWith('.pdf') ? '📄 PDF отчет' : '📊 Аналитический отчет');
      }

      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendDocument`,
        formData,
        {
          headers: formData.getHeaders(),
        },
      );

      if (response.status !== 200) {
        this.logger.error('Telegram sendDocument API error response:', response.data);
        throw new Error(
          `Telegram sendDocument API error: ${response.statusText}`,
        );
      }
    } catch (error) {
      this.logger.error('Error sending document:', error);
      throw error;
    }
  }

  /**
   * Send document from buffer (for on-demand PDF generation)
   * @param chatId - Telegram chat ID
   * @param buffer - PDF buffer
   * @param fileName - Filename for the document
   * @param caption - Optional caption
   */
  async sendDocumentFromBuffer(
    chatId: number,
    buffer: Buffer,
    fileName: string,
    caption?: string,
  ): Promise<void> {
    try {
      const formData = new FormData();

      formData.append('chat_id', chatId.toString());
      formData.append('document', buffer, {
        filename: fileName,
        contentType: 'application/pdf',
      });

      if (caption) {
        formData.append('caption', caption);
      } else {
        formData.append('caption', '📄 PDF отчет');
      }

      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendDocument`,
        formData,
        {
          headers: formData.getHeaders(),
        },
      );

      if (response.status !== 200) {
        this.logger.error('Telegram sendDocument API error response:', response.data);
        throw new Error(
          `Telegram sendDocument API error: ${response.statusText}`,
        );
      }

      this.logger.log(`Successfully sent PDF document (${buffer.length} bytes) to chat ${chatId}`);
    } catch (error) {
      this.logger.error('Error sending document from buffer:', error);
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

  async getBotInfo(): Promise<{ username: string; id: number; first_name: string }> {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/getMe`,
      );

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error("Telegram getMe API error response:", errorBody);
        throw new Error(
          `Telegram getMe API error: ${response.statusText} - ${errorBody}`,
        );
      }

      const data = await response.json();
      return {
        username: data.result.username,
        id: data.result.id,
        first_name: data.result.first_name,
      };
    } catch (error) {
      this.logger.error("Error getting bot info:", error);
      throw error;
    }
  }
}
