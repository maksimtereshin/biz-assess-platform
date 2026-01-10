import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TelegramService } from "./telegram.service";
import { ContentService } from "./content.service";
import { AuthService } from "../auth/auth.service";
import { SurveyService } from "../survey/survey.service";
import { PaymentService } from "../payment/payment.service";
import { AnalyticsService } from "../analytics/analytics.service";
import { ExcelService } from "../excel/excel.service";
import { CalendarService } from "./calendar/calendar.service";
import { ReportService } from "../report/report.service";
import { AdminService } from "../admin/admin.service";
import { User } from "../entities";

/**
 * Focused tests for Telegram navigation menu system
 * Tests critical behaviors: main menu rendering, submenu rendering, admin button visibility, callback routing
 * Scope: 8 tests maximum (as per spec requirements)
 */
describe("TelegramService - Navigation Menu", () => {
  let service: TelegramService;
  let contentService: ContentService;
  let adminService: AdminService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockContentService = {
    getCachedContent: jest.fn((key: string) => {
      const mockContent: Record<string, string> = {
        welcome_message:
          "Добро пожаловать в мастерскую Спроси у Богданова, {firstName}!",
        main_button_checkup: "🔍 Чекап",
        main_button_booking: "📅 Запись на старт сессию",
        main_button_about: "ℹ️ О проекте",
        main_button_faq: "❓ FAQ",
        main_button_referral: "🎁 Реферальная программа",
        main_button_admin: "🔧 Админ панель",
        checkup_submenu_title: "Выберите действие:",
        checkup_submenu_start: "🚀 Начать Чекап",
        checkup_submenu_results: "📊 Мои результаты",
        checkup_submenu_referral: "🎁 Реферальная программа",
        checkup_submenu_back: "⬅️ Назад",
        wip_message:
          "Эта функция находится в разработке. Скоро будет доступна!",
      };
      return mockContent[key] || key;
    }),
    getContent: jest.fn(),
  };

  const mockAdminService = {
    isAdmin: jest.fn(),
  };

  const mockAuthService = {
    generateAuthToken: jest.fn(),
  };

  const mockSurveyService = {
    getUserSessions: jest.fn(),
  };

  const mockPaymentService = {};
  const mockAnalyticsService = {};
  const mockExcelService = {};
  const mockCalendarService = {};
  const mockReportService = {};

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config = {
        TELEGRAM_BOT_TOKEN: "test_bot_token",
        FRONTEND_URL: "http://localhost:3000",
        BACKEND_URL: "http://localhost:4000",
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
          provide: ContentService,
          useValue: mockContentService,
        },
        {
          provide: AdminService,
          useValue: mockAdminService,
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
    contentService = module.get<ContentService>(ContentService);
    adminService = module.get<AdminService>(AdminService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  /**
   * Test 1: Main menu renders with 5 buttons from database content (non-admin user)
   * Critical: Verifies main menu loads button texts from ContentService
   */
  it("should render main menu with 5 buttons from database content for non-admin users", async () => {
    mockAdminService.isAdmin.mockResolvedValue(false);

    const user = {
      id: 123456789,
      username: "test_user",
      first_name: "Test",
    };

    const keyboard = await service.getMainKeyboard(user);

    // Verify all 5 main buttons exist (no admin button for non-admin)
    const allButtons = keyboard.inline_keyboard.flat();
    expect(allButtons).toHaveLength(5);

    // Verify button texts loaded from ContentService
    expect(mockContentService.getCachedContent).toHaveBeenCalledWith(
      "main_button_checkup",
    );
    expect(mockContentService.getCachedContent).toHaveBeenCalledWith(
      "main_button_booking",
    );
    expect(mockContentService.getCachedContent).toHaveBeenCalledWith(
      "main_button_about",
    );
    expect(mockContentService.getCachedContent).toHaveBeenCalledWith(
      "main_button_faq",
    );
    expect(mockContentService.getCachedContent).toHaveBeenCalledWith(
      "main_button_referral",
    );

    // Verify callback data follows naming convention
    const callbackData = allButtons
      .map((btn) => btn.callback_data)
      .filter(Boolean);
    expect(callbackData).toContain("main_checkup");
    expect(callbackData).toContain("main_booking");
    expect(callbackData).toContain("main_about");
    expect(callbackData).toContain("main_faq");
    expect(callbackData).toContain("main_referral");
  });

  /**
   * Test 2: Admin button visibility controlled by AdminService
   * Critical: Verifies admin button only shown to admins
   */
  it("should show admin button only for admin users", async () => {
    // Test admin user
    mockAdminService.isAdmin.mockResolvedValue(true);

    const adminUser = {
      id: 123456789,
      username: "admin_user",
      first_name: "Admin",
    };

    const adminKeyboard = await service.getMainKeyboard(adminUser);
    const adminButtons = adminKeyboard.inline_keyboard.flat();

    expect(adminButtons).toHaveLength(6); // 5 + admin button
    expect(mockAdminService.isAdmin).toHaveBeenCalledWith("admin_user");

    const hasAdminButton = adminButtons.some(
      (btn) => btn.callback_data === "main_admin",
    );
    expect(hasAdminButton).toBe(true);

    // Test regular user
    mockAdminService.isAdmin.mockResolvedValue(false);

    const regularUser = {
      id: 987654321,
      username: "regular_user",
      first_name: "Regular",
    };

    const regularKeyboard = await service.getMainKeyboard(regularUser);
    const regularButtons = regularKeyboard.inline_keyboard.flat();

    expect(regularButtons).toHaveLength(5); // No admin button
    expect(mockAdminService.isAdmin).toHaveBeenCalledWith("regular_user");

    const hasAdminButton2 = regularButtons.some(
      (btn) => btn.callback_data === "main_admin",
    );
    expect(hasAdminButton2).toBe(false);
  });

  /**
   * Test 3: Чекап submenu renders correctly with back button
   * Critical: Verifies submenu displays 4 buttons with content from database
   */
  it("should render Чекап submenu with 4 buttons and back button", () => {
    const submenu = service.getCheckupSubmenu();

    const allButtons = submenu.inline_keyboard.flat();
    expect(allButtons).toHaveLength(4);

    // Verify submenu button texts loaded from ContentService
    expect(mockContentService.getCachedContent).toHaveBeenCalledWith(
      "checkup_submenu_start",
    );
    expect(mockContentService.getCachedContent).toHaveBeenCalledWith(
      "checkup_submenu_results",
    );
    expect(mockContentService.getCachedContent).toHaveBeenCalledWith(
      "checkup_submenu_referral",
    );
    expect(mockContentService.getCachedContent).toHaveBeenCalledWith(
      "checkup_submenu_back",
    );

    // Verify callback data reuses existing handlers
    const callbackData = allButtons
      .map((btn) => btn.callback_data)
      .filter(Boolean);
    expect(callbackData).toContain("start_checkup");
    expect(callbackData).toContain("my_results");
    expect(callbackData).toContain("referral");
    expect(callbackData).toContain("back_to_main");
  });

  /**
   * Test 4: main_checkup callback shows submenu
   * Critical: Verifies navigation from main menu to Чекап submenu
   */
  it("should show Чекап submenu when main_checkup callback received", async () => {
    const callbackQuery = {
      id: "callback_123",
      from: {
        id: 123456789,
        username: "test_user",
        first_name: "Test",
        is_bot: false,
      },
      message: {
        message_id: 123,
        from: {
          id: 123456789,
          username: "test_user",
          first_name: "Test",
          is_bot: false,
        },
        chat: {
          id: 123456789,
          type: "private" as const,
          first_name: "Test",
        },
        date: Math.floor(Date.now() / 1000),
      },
      data: "main_checkup",
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ result: true }),
        text: async () => "OK",
      } as Response),
    );

    await service.handleWebhook({
      update_id: 123,
      callback_query: callbackQuery,
    });

    // Verify submenu title message sent
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("sendMessage"),
      expect.objectContaining({
        body: expect.stringContaining("Выберите действие"),
      }),
    );

    // Verify ContentService called for submenu title
    expect(mockContentService.getCachedContent).toHaveBeenCalledWith(
      "checkup_submenu_title",
    );
  });

  /**
   * Test 5: WIP message shown for unimplemented features
   * Critical: Verifies main_booking, main_about, main_faq show WIP message
   */
  it("should show WIP message for unimplemented features", async () => {
    const wipCallbacks = ["main_booking", "main_about", "main_faq"];

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ result: true }),
        text: async () => "OK",
      } as Response),
    );

    for (const callbackData of wipCallbacks) {
      jest.clearAllMocks();

      const callbackQuery = {
        id: `callback_${callbackData}`,
        from: {
          id: 123456789,
          username: "test_user",
          first_name: "Test",
          is_bot: false,
        },
        message: {
          message_id: 123,
          from: {
            id: 123456789,
            username: "test_user",
            first_name: "Test",
            is_bot: false,
          },
          chat: {
            id: 123456789,
            type: "private" as const,
            first_name: "Test",
          },
          date: Math.floor(Date.now() / 1000),
        },
        data: callbackData,
      };

      await service.handleWebhook({
        update_id: 123,
        callback_query: callbackQuery,
      });

      // Verify WIP message sent
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("sendMessage"),
        expect.objectContaining({
          body: expect.stringContaining("Эта функция находится в разработке"),
        }),
      );

      // Verify ContentService called for WIP message
      expect(mockContentService.getCachedContent).toHaveBeenCalledWith(
        "wip_message",
      );
    }
  });

  /**
   * Test 6: /start command shows welcome message with main menu
   * Critical: Verifies welcome message loads from database with {firstName} replacement
   */
  it("should show welcome message with main menu on /start command", async () => {
    mockAdminService.isAdmin.mockResolvedValue(false);
    mockUserRepository.findOne.mockResolvedValue(null);
    mockUserRepository.create.mockReturnValue({
      telegram_id: 123456789,
      first_name: "Maksim",
      username: "test_user",
    });
    mockUserRepository.save.mockResolvedValue({});

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ result: true }),
        text: async () => "OK",
      } as Response),
    );

    const message = {
      message_id: 123,
      from: {
        id: 123456789,
        username: "test_user",
        first_name: "Maksim",
        is_bot: false,
      },
      chat: {
        id: 123456789,
        type: "private" as const,
        first_name: "Maksim",
      },
      date: Math.floor(Date.now() / 1000),
      text: "/start",
    };

    await service.handleWebhook({
      update_id: 123,
      message,
    });

    // Verify welcome message loaded from ContentService
    expect(mockContentService.getCachedContent).toHaveBeenCalledWith(
      "welcome_message",
    );

    // Verify {firstName} placeholder replaced
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("sendMessage"),
      expect.objectContaining({
        body: expect.stringContaining("Maksim"),
      }),
    );

    // Verify main menu displayed
    expect(mockContentService.getCachedContent).toHaveBeenCalledWith(
      "main_button_checkup",
    );
  });

  /**
   * Test 7: Bot commands configured on service initialization
   * Critical: Verifies onModuleInit sets bot commands via Telegram API
   */
  it("should configure bot commands on service initialization", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ result: true }),
        text: async () => "OK",
      } as Response),
    );

    await service.onModuleInit();

    // Verify setMyCommands API call
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("setMyCommands"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("command"),
      }),
    );

    // Verify command descriptions loaded from ContentService
    expect(mockContentService.getCachedContent).toHaveBeenCalledWith(
      "command_start_desc",
    );
    expect(mockContentService.getCachedContent).toHaveBeenCalledWith(
      "command_checkup_desc",
    );
    expect(mockContentService.getCachedContent).toHaveBeenCalledWith(
      "command_results_desc",
    );
  });

  /**
   * Test 8: back_to_main callback returns to main menu
   * Critical: Verifies back button navigation works correctly
   */
  it("should return to main menu when back_to_main callback received", async () => {
    mockAdminService.isAdmin.mockResolvedValue(false);
    mockUserRepository.findOne.mockResolvedValue({
      telegram_id: 123456789,
      first_name: "Test",
      username: "test_user",
    });

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ result: true }),
        text: async () => "OK",
      } as Response),
    );

    const callbackQuery = {
      id: "callback_back",
      from: {
        id: 123456789,
        username: "test_user",
        first_name: "Test",
        is_bot: false,
      },
      message: {
        message_id: 123,
        from: {
          id: 123456789,
          username: "test_user",
          first_name: "Test",
          is_bot: false,
        },
        chat: {
          id: 123456789,
          type: "private" as const,
          first_name: "Test",
        },
        date: Math.floor(Date.now() / 1000),
      },
      data: "back_to_main",
    };

    await service.handleWebhook({
      update_id: 123,
      callback_query: callbackQuery,
    });

    // Verify main menu displayed again
    expect(mockContentService.getCachedContent).toHaveBeenCalledWith(
      "welcome_message",
    );
    expect(mockContentService.getCachedContent).toHaveBeenCalledWith(
      "main_button_checkup",
    );
  });
});
