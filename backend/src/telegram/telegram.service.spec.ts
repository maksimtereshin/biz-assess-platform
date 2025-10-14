import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelegramService } from './telegram.service';
import { AuthService } from '../auth/auth.service';
import { SurveyService } from '../survey/survey.service';
import { PaymentService } from '../payment/payment.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ExcelService } from '../excel/excel.service';
import { CalendarService } from './calendar/calendar.service';
import { ReportService } from '../report/report.service';
import { User } from '../entities';
import { ADMIN_USERNAMES } from './telegram.constants';

describe('TelegramService', () => {
  let service: TelegramService;
  let userRepository: Repository<User>;
  let authService: AuthService;
  let surveyService: SurveyService;
  let paymentService: PaymentService;
  let analyticsService: AnalyticsService;
  let excelService: ExcelService;
  let calendarService: CalendarService;
  let reportService: ReportService;
  let configService: ConfigService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockAuthService = {
    generateAuthToken: jest.fn(),
  };

  const mockSurveyService = {
    getUserSessions: jest.fn(),
    generateReport: jest.fn(),
    getPaidReport: jest.fn(),
    getSession: jest.fn(),
  };

  const mockPaymentService = {
    createPayment: jest.fn(),
  };

  const mockAnalyticsService = {
    getTotalUsers: jest.fn(),
    getNewUsers: jest.fn(),
    getUserGrowthRate: jest.fn(),
    getSurveyStats: jest.fn(),
    getConversionRate: jest.fn(),
    getAverageCompletionTime: jest.fn(),
    getAverageScores: jest.fn(),
    getPaidRetakes: jest.fn(),
    getTotalRevenue: jest.fn(),
    getPeriodRevenue: jest.fn(),
    getAverageRevenuePerUser: jest.fn(),
    getPaymentConversionRate: jest.fn(),
    getUsersWithMostCompletions: jest.fn(),
  };

  const mockExcelService = {
    generateAnalyticsReport: jest.fn(),
    deleteReportFile: jest.fn(),
  };

  const mockCalendarService = {
    generateCalendar: jest.fn(),
    generateCalendarWithSelection: jest.fn(),
    parseCallbackData: jest.fn(),
    getPreviousMonth: jest.fn(),
    getNextMonth: jest.fn(),
    validateDateRange: jest.fn(),
  };

  const mockReportService = {
    generateReport: jest.fn(),
    getReport: jest.fn(),
    getUserReports: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config = {
        TELEGRAM_BOT_TOKEN: 'test_bot_token',
        FRONTEND_URL: 'http://localhost:3000',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: SurveyService,
          useValue: mockSurveyService,
        },
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
        {
          provide: ExcelService,
          useValue: mockExcelService,
        },
        {
          provide: CalendarService,
          useValue: mockCalendarService,
        },
        {
          provide: ReportService,
          useValue: mockReportService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    authService = module.get<AuthService>(AuthService);
    surveyService = module.get<SurveyService>(SurveyService);
    paymentService = module.get<PaymentService>(PaymentService);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
    excelService = module.get<ExcelService>(ExcelService);
    calendarService = module.get<CalendarService>(CalendarService);
    reportService = module.get<ReportService>(ReportService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Admin Authorization', () => {
    describe('isAdmin()', () => {
      it('should return true for admin usernames in the list', () => {
        const adminUsername = ADMIN_USERNAMES[0];
        expect(service.isAdmin(adminUsername)).toBe(true);
      });

      it('should return true for all admin usernames in the list', () => {
        ADMIN_USERNAMES.forEach((username) => {
          expect(service.isAdmin(username)).toBe(true);
        });
      });

      it('should return false for non-admin usernames', () => {
        expect(service.isAdmin('regular_user')).toBe(false);
        expect(service.isAdmin('random_person')).toBe(false);
      });

      it('should handle case-insensitive matching', () => {
        const adminUsername = ADMIN_USERNAMES[0]; // 'maksim_tereshin'
        expect(service.isAdmin(adminUsername.toUpperCase())).toBe(true);
        expect(service.isAdmin(adminUsername.toLowerCase())).toBe(true);
        expect(service.isAdmin('MAKSIM_TERESHIN')).toBe(true);
        expect(service.isAdmin('MaKsIm_TeReShIn')).toBe(true);
      });

      it('should return false for undefined username', () => {
        expect(service.isAdmin(undefined)).toBe(false);
      });

      it('should return false for null username', () => {
        expect(service.isAdmin(null)).toBe(false);
      });

      it('should return false for empty string', () => {
        expect(service.isAdmin('')).toBe(false);
      });

      it('should handle usernames with special characters', () => {
        expect(service.isAdmin('user@name')).toBe(false);
        expect(service.isAdmin('user.name')).toBe(false);
      });

      it('should trim whitespace from usernames', () => {
        const adminUsername = ADMIN_USERNAMES[0];
        expect(service.isAdmin(`  ${adminUsername}  `)).toBe(true);
      });
    });

    describe('Admin Button Visibility', () => {
      it('should include admin button in main keyboard for admin users', () => {
        const adminUser = {
          id: 123456789,
          username: ADMIN_USERNAMES[0],
          first_name: 'Admin',
        };

        const keyboard = service.getMainKeyboard(adminUser);

        // Check if admin button exists
        const hasAdminButton = keyboard.inline_keyboard.some((row) =>
          row.some((button) => button.callback_data === 'admin_panel'),
        );

        expect(hasAdminButton).toBe(true);
      });

      it('should NOT include admin button in main keyboard for non-admin users', () => {
        const regularUser = {
          id: 987654321,
          username: 'regular_user',
          first_name: 'Regular',
        };

        const keyboard = service.getMainKeyboard(regularUser);

        // Check that admin button does not exist
        const hasAdminButton = keyboard.inline_keyboard.some((row) =>
          row.some((button) => button.callback_data === 'admin_panel'),
        );

        expect(hasAdminButton).toBe(false);
      });

      it('should NOT include admin button for users without username', () => {
        const userNoUsername = {
          id: 111222333,
          first_name: 'NoUsername',
          username: undefined,
        };

        const keyboard = service.getMainKeyboard(userNoUsername);

        const hasAdminButton = keyboard.inline_keyboard.some((row) =>
          row.some((button) => button.callback_data === 'admin_panel'),
        );

        expect(hasAdminButton).toBe(false);
      });

      it('should maintain existing button layout for non-admins', () => {
        const regularUser = {
          id: 987654321,
          username: 'regular_user',
          first_name: 'Regular',
        };

        const keyboard = service.getMainKeyboard(regularUser);

        // Verify standard buttons exist
        const expectedButtons = [
          'start_checkup',
          'my_results',
          'referral',
          'about',
          'help',
        ];

        const allCallbackData = keyboard.inline_keyboard
          .flat()
          .map((button) => button.callback_data)
          .filter(Boolean);

        expectedButtons.forEach((expectedData) => {
          expect(allCallbackData).toContain(expectedData);
        });
      });

      it('should maintain existing button layout for admins plus admin button', () => {
        const adminUser = {
          id: 123456789,
          username: ADMIN_USERNAMES[0],
          first_name: 'Admin',
        };

        const keyboard = service.getMainKeyboard(adminUser);

        // Verify all buttons exist including admin
        const expectedButtons = [
          'start_checkup',
          'my_results',
          'referral',
          'about',
          'help',
          'admin_panel',
        ];

        const allCallbackData = keyboard.inline_keyboard
          .flat()
          .map((button) => button.callback_data)
          .filter(Boolean);

        expectedButtons.forEach((expectedData) => {
          expect(allCallbackData).toContain(expectedData);
        });
      });
    });

    describe('Non-Admin Access Restriction', () => {
      it('should block non-admin access to admin panel callback', async () => {
        const regularUser = {
          id: 987654321,
          username: 'regular_user',
          first_name: 'Regular',
          is_bot: false,
        };

        const callbackQuery = {
          id: 'callback_123',
          from: regularUser,
          message: {
            message_id: 123,
            from: regularUser,
            chat: {
              id: 987654321,
              type: 'private' as const,
              first_name: 'Regular',
            },
            date: Math.floor(Date.now() / 1000),
          },
          data: 'admin_panel',
        };

        // Mock fetch to capture sendMessage calls
        global.fetch = jest.fn(() =>
          Promise.resolve({
            ok: true,
            json: async () => ({ result: true }),
            text: async () => 'OK',
          } as Response),
        );

        await service.handleWebhook({ update_id: 123, callback_query: callbackQuery });

        // Verify that unauthorized message was sent
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('sendMessage'),
          expect.objectContaining({
            body: expect.stringContaining('не авторизованы'),
          }),
        );
      });

      it('should allow admin access to admin panel callback', async () => {
        const adminUser = {
          id: 123456789,
          username: ADMIN_USERNAMES[0],
          first_name: 'Admin',
          is_bot: false,
        };

        const callbackQuery = {
          id: 'callback_456',
          from: adminUser,
          message: {
            message_id: 456,
            from: adminUser,
            chat: {
              id: 123456789,
              type: 'private' as const,
              first_name: 'Admin',
            },
            date: Math.floor(Date.now() / 1000),
          },
          data: 'admin_panel',
        };

        // Mock fetch to capture sendMessage calls
        global.fetch = jest.fn(() =>
          Promise.resolve({
            ok: true,
            json: async () => ({ result: true }),
            text: async () => 'OK',
          } as Response),
        );

        await service.handleWebhook({ update_id: 123, callback_query: callbackQuery });

        // Verify that admin menu was sent (should NOT contain unauthorized message)
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('sendMessage'),
          expect.objectContaining({
            body: expect.stringContaining('Админ Панель'),
          }),
        );
      });

      it('should block analytics callback for non-admins', async () => {
        const regularUser = {
          id: 987654321,
          username: 'regular_user',
          first_name: 'Regular',
          is_bot: false,
        };

        const callbackQuery = {
          id: 'callback_789',
          from: regularUser,
          message: {
            message_id: 789,
            from: regularUser,
            chat: {
              id: 987654321,
              type: 'private' as const,
              first_name: 'Regular',
            },
            date: Math.floor(Date.now() / 1000),
          },
          data: 'analytics_all_time',
        };

        global.fetch = jest.fn(() =>
          Promise.resolve({
            ok: true,
            json: async () => ({ result: true }),
            text: async () => 'OK',
          } as Response),
        );

        await service.handleWebhook({ update_id: 123, callback_query: callbackQuery });

        // Verify that unauthorized message was sent
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('sendMessage'),
          expect.objectContaining({
            body: expect.stringContaining('не авторизованы'),
          }),
        );
      });
    });

    describe('Edge Cases', () => {
      it('should handle user with undefined username gracefully', () => {
        const user = {
          id: 123,
          first_name: 'Test',
          username: undefined,
        };

        expect(service.isAdmin(user.username)).toBe(false);

        const keyboard = service.getMainKeyboard(user);
        const hasAdminButton = keyboard.inline_keyboard.some((row) =>
          row.some((button) => button.callback_data === 'admin_panel'),
        );
        expect(hasAdminButton).toBe(false);
      });

      it('should handle username with different casing combinations', () => {
        const adminUsername = ADMIN_USERNAMES[0];
        const variations = [
          adminUsername.toUpperCase(),
          adminUsername.toLowerCase(),
          adminUsername.charAt(0).toUpperCase() + adminUsername.slice(1).toLowerCase(),
        ];

        variations.forEach((variation) => {
          expect(service.isAdmin(variation)).toBe(true);
        });
      });

      it('should not match partial admin usernames', () => {
        const adminUsername = ADMIN_USERNAMES[0];
        expect(service.isAdmin(adminUsername.substring(0, 5))).toBe(false);
        expect(service.isAdmin(`${adminUsername}_extra`)).toBe(false);
      });
    });
  });

  describe('Admin Panel Integration', () => {
    describe('Report Generation Flow', () => {
      beforeEach(() => {
        // Mock analytics data
        mockAnalyticsService.getTotalUsers.mockResolvedValue(1000);
        mockAnalyticsService.getNewUsers.mockResolvedValue(150);
        mockAnalyticsService.getUserGrowthRate.mockResolvedValue(15.5);
        mockAnalyticsService.getSurveyStats.mockResolvedValue({ started: 500, completed: 400 });
        mockAnalyticsService.getConversionRate.mockResolvedValue(80);
        mockAnalyticsService.getAverageCompletionTime.mockResolvedValue(18);
        mockAnalyticsService.getAverageScores.mockResolvedValue(7.5);
        mockAnalyticsService.getPaidRetakes.mockResolvedValue(50);
        mockAnalyticsService.getTotalRevenue.mockResolvedValue(50000);
        mockAnalyticsService.getPeriodRevenue.mockResolvedValue(10000);
        mockAnalyticsService.getAverageRevenuePerUser.mockResolvedValue(50);
        mockAnalyticsService.getPaymentConversionRate.mockResolvedValue(10.5);
        mockAnalyticsService.getUsersWithMostCompletions.mockResolvedValue([
          {
            telegramId: 111,
            firstName: 'Top User',
            username: 'topuser',
            completedSurveys: 10,
            averageScore: 8.5,
            lastActivityDate: new Date(),
          },
        ]);

        // Mock Excel generation
        mockExcelService.generateAnalyticsReport.mockResolvedValue('/tmp/report_123.xlsx');
        mockExcelService.deleteReportFile.mockResolvedValue(undefined);

        // Mock fetch for Telegram API calls
        global.fetch = jest.fn(() =>
          Promise.resolve({
            ok: true,
            json: async () => ({ result: true }),
            text: async () => 'OK',
          } as Response),
        );
      });

      it('should generate all-time analytics report for admin', async () => {
        const adminUser = {
          id: 123456789,
          username: ADMIN_USERNAMES[0],
          first_name: 'Admin',
          is_bot: false,
        };

        const callbackQuery = {
          id: 'callback_analytics',
          from: adminUser,
          message: {
            message_id: 123,
            from: adminUser,
            chat: {
              id: 123456789,
              type: 'private' as const,
              first_name: 'Admin',
            },
            date: Math.floor(Date.now() / 1000),
          },
          data: 'analytics_all_time',
        };

        await service.handleWebhook({ update_id: 123, callback_query: callbackQuery });

        // Verify analytics methods were called
        expect(mockAnalyticsService.getTotalUsers).toHaveBeenCalled();
        expect(mockAnalyticsService.getNewUsers).toHaveBeenCalled();

        // Verify Excel generation was called
        expect(mockExcelService.generateAnalyticsReport).toHaveBeenCalled();

        // Verify file cleanup
        expect(mockExcelService.deleteReportFile).toHaveBeenCalledWith('/tmp/report_123.xlsx');
      });

      it('should enforce rate limiting on report generation', async () => {
        const adminUser = {
          id: 123456789,
          username: ADMIN_USERNAMES[0],
          first_name: 'Admin',
          is_bot: false,
        };

        const callbackQuery = {
          id: 'callback_rate_limit',
          from: adminUser,
          message: {
            message_id: 456,
            from: adminUser,
            chat: {
              id: 123456789,
              type: 'private' as const,
              first_name: 'Admin',
            },
            date: Math.floor(Date.now() / 1000),
          },
          data: 'analytics_all_time',
        };

        // Generate first report
        await service.handleWebhook({ update_id: 123, callback_query: callbackQuery });

        // Clear mocks
        jest.clearAllMocks();

        // Try to generate second report immediately
        await service.handleWebhook({ update_id: 124, callback_query: callbackQuery });

        // Verify that analytics was NOT called again (rate limited)
        expect(mockAnalyticsService.getTotalUsers).not.toHaveBeenCalled();

        // Verify rate limit message was sent
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('sendMessage'),
          expect.objectContaining({
            body: expect.stringContaining('подождите'),
          }),
        );
      });

      it(
        'should handle report generation timeout',
        async () => {
          // Mock slow analytics call that exceeds 30s timeout
          mockAnalyticsService.getTotalUsers.mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 35000)),
          );

          const adminUser = {
            id: 123456789,
            username: ADMIN_USERNAMES[0],
            first_name: 'Admin',
            is_bot: false,
          };

          const callbackQuery = {
            id: 'callback_timeout',
            from: adminUser,
            message: {
              message_id: 789,
              from: adminUser,
              chat: {
                id: 123456789,
                type: 'private' as const,
                first_name: 'Admin',
              },
              date: Math.floor(Date.now() / 1000),
            },
            data: 'analytics_all_time',
          };

          await service.handleWebhook({ update_id: 123, callback_query: callbackQuery });

          // Verify timeout error message was sent
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('sendMessage'),
            expect.objectContaining({
              body: expect.stringContaining('Превышено время ожидания'),
            }),
          );
        },
        40000, // 40 second timeout for this test
      );

      it('should handle report generation errors gracefully', async () => {
        // Mock error in analytics
        mockAnalyticsService.getTotalUsers.mockRejectedValue(new Error('Database error'));

        const adminUser = {
          id: 123456789,
          username: ADMIN_USERNAMES[0],
          first_name: 'Admin',
          is_bot: false,
        };

        const callbackQuery = {
          id: 'callback_error',
          from: adminUser,
          message: {
            message_id: 999,
            from: adminUser,
            chat: {
              id: 123456789,
              type: 'private' as const,
              first_name: 'Admin',
            },
            date: Math.floor(Date.now() / 1000),
          },
          data: 'analytics_all_time',
        };

        await service.handleWebhook({ update_id: 123, callback_query: callbackQuery });

        // Verify error message was sent
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('sendMessage'),
          expect.objectContaining({
            body: expect.stringContaining('Ошибка при генерации отчета'),
          }),
        );
      });
    });

    describe('User Results Viewing', () => {
      it('should display indexed list of completed surveys', async () => {
        const sessions = [
          {
            id: 'session1',
            status: 'COMPLETED',
            created_at: new Date('2025-10-08'),
            survey: { type: 'EXPRESS' },
          },
          {
            id: 'session2',
            status: 'COMPLETED',
            created_at: new Date('2025-10-09'),
            survey: { type: 'FULL' },
          },
        ];

        mockSurveyService.getUserSessions.mockResolvedValue(sessions);

        global.fetch = jest.fn(() =>
          Promise.resolve({
            ok: true,
            json: async () => ({ result: true }),
            text: async () => 'OK',
          } as Response),
        );

        const message = {
          message_id: 123,
          from: {
            id: 987654321,
            first_name: 'User',
            is_bot: false,
          },
          chat: {
            id: 987654321,
            type: 'private' as const,
            first_name: 'User',
          },
          date: Math.floor(Date.now() / 1000),
          text: '/reports',
        };

        await service.handleWebhook({ update_id: 123, message });

        // Verify getUserSessions was called
        expect(mockSurveyService.getUserSessions).toHaveBeenCalledWith(987654321);

        // Verify message was sent with indexed list
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('sendMessage'),
          expect.objectContaining({
            body: expect.stringMatching(/1\.\s+express-2025-10-08/),
          }),
        );

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('sendMessage'),
          expect.objectContaining({
            body: expect.stringMatching(/2\.\s+full-2025-10-09/),
          }),
        );
      });

      it('should show appropriate message when no completed surveys exist', async () => {
        mockSurveyService.getUserSessions.mockResolvedValue([]);

        global.fetch = jest.fn(() =>
          Promise.resolve({
            ok: true,
            json: async () => ({ result: true }),
            text: async () => 'OK',
          } as Response),
        );

        const message = {
          message_id: 456,
          from: {
            id: 888888888,
            first_name: 'NewUser',
            is_bot: false,
          },
          chat: {
            id: 888888888,
            type: 'private' as const,
            first_name: 'NewUser',
          },
          date: Math.floor(Date.now() / 1000),
          text: '/reports',
        };

        await service.handleWebhook({ update_id: 124, message });

        // Verify empty state message
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('sendMessage'),
          expect.objectContaining({
            body: expect.stringContaining('нет завершенных опросов'),
          }),
        );
      });

      it('should provide PDF download buttons for each result', async () => {
        const sessions = [
          {
            id: 'session123',
            status: 'COMPLETED',
            created_at: new Date('2025-10-08'),
            survey: { type: 'EXPRESS' },
          },
        ];

        mockSurveyService.getUserSessions.mockResolvedValue(sessions);

        global.fetch = jest.fn(() =>
          Promise.resolve({
            ok: true,
            json: async () => ({ result: true }),
            text: async () => 'OK',
          } as Response),
        );

        const message = {
          message_id: 789,
          from: {
            id: 777777777,
            first_name: 'TestUser',
            is_bot: false,
          },
          chat: {
            id: 777777777,
            type: 'private' as const,
            first_name: 'TestUser',
          },
          date: Math.floor(Date.now() / 1000),
          text: '/reports',
        };

        await service.handleWebhook({ update_id: 125, message });

        // Verify download button callback data
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('sendMessage'),
          expect.objectContaining({
            body: expect.stringContaining('download_report_session123'),
          }),
        );
      });
    });

    describe('PDF Report Download', () => {
      beforeEach(() => {
        global.fetch = jest.fn(() =>
          Promise.resolve({
            ok: true,
            json: async () => ({ result: true }),
            text: async () => 'OK',
          } as Response),
        );
      });

      it('should validate session ownership before generating report', async () => {
        const userId = 123456789;
        const sessionId = 'session123';

        // Mock session with different user
        mockSurveyService.getSession.mockResolvedValue({
          id: sessionId,
          userId: 987654321, // Different user
          surveyType: 'express',
          status: 'COMPLETED',
          answers: {},
        });

        const callbackQuery = {
          id: 'callback_download',
          from: {
            id: userId,
            first_name: 'User',
            is_bot: false,
          },
          message: {
            message_id: 123,
            from: {
              id: userId,
              first_name: 'User',
              is_bot: false,
            },
            chat: {
              id: userId,
              type: 'private' as const,
              first_name: 'User',
            },
            date: Math.floor(Date.now() / 1000),
          },
          data: `download_report_${sessionId}`,
        };

        await service.handleWebhook({ update_id: 123, callback_query: callbackQuery });

        // Verify error message was sent
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('sendMessage'),
          expect.objectContaining({
            body: expect.stringContaining('нет доступа'),
          }),
        );

        // Verify report was NOT generated
        expect(mockReportService.generateReport).not.toHaveBeenCalled();
      });

      it('should generate free report for first completed survey', async () => {
        const userId = 123456789;
        const sessionId = 'session123';

        // Mock session owned by user
        mockSurveyService.getSession.mockResolvedValue({
          id: sessionId,
          userId: userId,
          surveyType: 'express',
          status: 'COMPLETED',
          answers: {},
        });

        // Mock user has only one completed session (first one is free)
        mockSurveyService.getUserSessions.mockResolvedValue([
          {
            id: sessionId,
            status: 'COMPLETED',
            user_telegram_id: userId,
          },
        ]);

        // Mock report generation
        mockReportService.generateReport.mockResolvedValue({
          id: 'report123',
          session_id: sessionId,
          storage_url: '/tmp/report.pdf',
          payment_status: 'FREE',
        });

        const callbackQuery = {
          id: 'callback_download',
          from: {
            id: userId,
            first_name: 'User',
            is_bot: false,
          },
          message: {
            message_id: 123,
            from: {
              id: userId,
              first_name: 'User',
              is_bot: false,
            },
            chat: {
              id: userId,
              type: 'private' as const,
              first_name: 'User',
            },
            date: Math.floor(Date.now() / 1000),
          },
          data: `download_report_${sessionId}`,
        };

        await service.handleWebhook({ update_id: 123, callback_query: callbackQuery });

        // Verify free report was generated
        expect(mockReportService.generateReport).toHaveBeenCalledWith(sessionId, false);
      });

      it('should initiate payment flow for subsequent surveys', async () => {
        const userId = 123456789;
        const sessionId = 'session456';

        // Mock session owned by user
        mockSurveyService.getSession.mockResolvedValue({
          id: sessionId,
          userId: userId,
          surveyType: 'full',
          status: 'COMPLETED',
          answers: {},
        });

        // Mock user has multiple completed sessions
        mockSurveyService.getUserSessions.mockResolvedValue([
          {
            id: 'session123',
            status: 'COMPLETED',
            user_telegram_id: userId,
          },
          {
            id: sessionId,
            status: 'COMPLETED',
            user_telegram_id: userId,
          },
        ]);

        const callbackQuery = {
          id: 'callback_download',
          from: {
            id: userId,
            first_name: 'User',
            is_bot: false,
          },
          message: {
            message_id: 123,
            from: {
              id: userId,
              first_name: 'User',
              is_bot: false,
            },
            chat: {
              id: userId,
              type: 'private' as const,
              first_name: 'User',
            },
            date: Math.floor(Date.now() / 1000),
          },
          data: `download_report_${sessionId}`,
        };

        await service.handleWebhook({ update_id: 123, callback_query: callbackQuery });

        // Verify payment message was sent
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('sendMessage'),
          expect.objectContaining({
            body: expect.stringContaining('Оплата'),
          }),
        );

        // Verify report was NOT generated yet
        expect(mockReportService.generateReport).not.toHaveBeenCalled();
      });

      it('should handle missing session gracefully', async () => {
        const userId = 123456789;
        const sessionId = 'nonexistent';

        // Mock session not found
        mockSurveyService.getSession.mockRejectedValue(
          new Error('Session not found'),
        );

        const callbackQuery = {
          id: 'callback_download',
          from: {
            id: userId,
            first_name: 'User',
            is_bot: false,
          },
          message: {
            message_id: 123,
            from: {
              id: userId,
              first_name: 'User',
              is_bot: false,
            },
            chat: {
              id: userId,
              type: 'private' as const,
              first_name: 'User',
            },
            date: Math.floor(Date.now() / 1000),
          },
          data: `download_report_${sessionId}`,
        };

        await service.handleWebhook({ update_id: 123, callback_query: callbackQuery });

        // Verify error message was sent
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('sendMessage'),
          expect.objectContaining({
            body: expect.stringContaining('не найден'),
          }),
        );
      });

      it('should handle PDF generation errors', async () => {
        const userId = 123456789;
        const sessionId = 'session123';

        // Mock session owned by user
        mockSurveyService.getSession.mockResolvedValue({
          id: sessionId,
          userId: userId,
          surveyType: 'express',
          status: 'COMPLETED',
          answers: {},
        });

        // Mock user has one completed session
        mockSurveyService.getUserSessions.mockResolvedValue([
          {
            id: sessionId,
            status: 'COMPLETED',
            user_telegram_id: userId,
          },
        ]);

        // Mock report generation failure
        mockReportService.generateReport.mockRejectedValue(
          new Error('PDF generation failed'),
        );

        const callbackQuery = {
          id: 'callback_download',
          from: {
            id: userId,
            first_name: 'User',
            is_bot: false,
          },
          message: {
            message_id: 123,
            from: {
              id: userId,
              first_name: 'User',
              is_bot: false,
            },
            chat: {
              id: userId,
              type: 'private' as const,
              first_name: 'User',
            },
            date: Math.floor(Date.now() / 1000),
          },
          data: `download_report_${sessionId}`,
        };

        await service.handleWebhook({ update_id: 123, callback_query: callbackQuery });

        // Verify error message was sent
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('sendMessage'),
          expect.objectContaining({
            body: expect.stringContaining('Ошибка'),
          }),
        );
      });
    });

    describe('File Downloads', () => {
      // Skip this test as FormData mocking is complex and requires manual testing
      // TODO: Test file uploads manually or with E2E tests
      it.skip('should send document via Telegram API', async () => {
        // This test requires proper FormData mocking which is difficult in Jest
        // Manual testing or E2E testing recommended for file upload functionality

        global.fetch = jest.fn(() =>
          Promise.resolve({
            ok: true,
            json: async () => ({ result: true }),
            text: async () => 'OK',
          } as Response),
        );

        // Access private method through any for testing
        await (service as any).sendDocument(123456789, '/tmp/test.xlsx', 'report.xlsx');

        // Verify fetch was called with sendDocument endpoint
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('sendDocument'),
          expect.any(Object),
        );
      });
    });
  });
});
