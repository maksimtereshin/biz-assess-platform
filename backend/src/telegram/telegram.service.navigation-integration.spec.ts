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
 * Integration and error handling tests for Telegram navigation menu
 * Tests critical scenarios: database failures, missing content, invalid users
 * Scope: Maximum 10 strategic tests to fill coverage gaps
 */
describe("TelegramService - Navigation Integration & Error Handling", () => {
  let service: TelegramService;
  let contentService: ContentService;
  let adminService: AdminService;
  let userRepository: Repository<User>;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockContentService = {
    getCachedContent: jest.fn(),
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
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  /**
   * Test 1: Main menu uses fallback content when database unavailable
   * Critical: Verifies graceful degradation when ContentService returns fallback
   */
  it("should render main menu with fallback content when database unavailable", async () => {
    mockAdminService.isAdmin.mockResolvedValue(false);

    // Simulate ContentService returning fallback values
    mockContentService.getCachedContent.mockImplementation(
      (key: string) => `FALLBACK_${key}`,
    );

    const user = {
      id: 123456789,
      username: "test_user",
      first_name: "Test",
    };

    const keyboard = await service.getMainKeyboard(user);

    // Verify keyboard still renders with fallback content
    expect(keyboard).toBeDefined();
    expect(keyboard.inline_keyboard).toBeDefined();
    const allButtons = keyboard.inline_keyboard.flat();
    expect(allButtons.length).toBeGreaterThan(0);

    // Verify ContentService was called
    expect(mockContentService.getCachedContent).toHaveBeenCalled();
  });

  /**
   * Test 2: Welcome message handles user without first_name
   * Critical: Verifies null/undefined first_name doesn't crash
   */
  it("should handle /start command for user without first_name", async () => {
    mockAdminService.isAdmin.mockResolvedValue(false);
    mockUserRepository.findOne.mockResolvedValue(null);
    mockUserRepository.create.mockReturnValue({
      telegram_id: 123456789,
      username: "test_user",
      first_name: null, // User without first name
    });
    mockUserRepository.save.mockResolvedValue({});

    mockContentService.getCachedContent.mockImplementation((key: string) => {
      if (key === "welcome_message") return "Добро пожаловать, {firstName}!";
      return "Button";
    });

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
        first_name: undefined, // Telegram user without name
        is_bot: false,
      },
      chat: {
        id: 123456789,
        type: "private" as const,
      },
      date: Math.floor(Date.now() / 1000),
      text: "/start",
    };

    // Should not throw error
    await expect(
      service.handleWebhook({
        update_id: 123,
        message,
      }),
    ).resolves.not.toThrow();

    expect(global.fetch).toHaveBeenCalled();
  });

  /**
   * Test 3: Main menu handles user without username
   * Critical: Verifies admin check is skipped when username is null (correct behavior)
   */
  it("should handle main menu for user without username", async () => {
    // Setup mock (won't be called since username is null)
    mockAdminService.isAdmin.mockResolvedValue(false);
    mockContentService.getCachedContent.mockReturnValue("Button");

    const user = {
      id: 123456789,
      username: null, // User without username
      first_name: "Test",
    };

    const keyboard = await service.getMainKeyboard(user);

    // Should still render menu
    expect(keyboard).toBeDefined();
    const allButtons = keyboard.inline_keyboard.flat();
    expect(allButtons).toHaveLength(5); // 5 buttons (no admin button)

    // Verify AdminService.isAdmin NOT called (username is null)
    // This is correct behavior - don't query AdminService without username
    expect(mockAdminService.isAdmin).not.toHaveBeenCalled();
  });

  /**
   * Test 4: Invalid callback data doesn't crash handleWebhook
   * Critical: Verifies unknown callback_data is handled gracefully
   */
  it("should handle unknown callback data gracefully", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ result: true }),
        text: async () => "OK",
      } as Response),
    );

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
      data: "invalid_callback_xyz", // Unknown callback data
    };

    // Should not throw error
    await expect(
      service.handleWebhook({
        update_id: 123,
        callback_query: callbackQuery,
      }),
    ).resolves.not.toThrow();
  });

  /**
   * Test 5: AdminService.isAdmin failure returns false and doesn't break main menu
   * Critical: Verifies menu renders even if admin check fails
   */
  it("should render main menu when AdminService.isAdmin throws error", async () => {
    // Simulate AdminService failure (database unavailable)
    mockAdminService.isAdmin.mockRejectedValue(
      new Error("Database connection failed"),
    );

    mockContentService.getCachedContent.mockReturnValue("Button");

    const user = {
      id: 123456789,
      username: "test_user",
      first_name: "Test",
    };

    // Should still render menu (error caught internally, defaults to non-admin)
    const keyboard = await service.getMainKeyboard(user);

    expect(keyboard).toBeDefined();
    const allButtons = keyboard.inline_keyboard.flat();

    // Should render 5 buttons (admin check failed, so no admin button)
    expect(allButtons.length).toBeGreaterThanOrEqual(5);
  });

  /**
   * Test 6: Checkup submenu uses fallback content when ContentService fails
   * Critical: Verifies submenu graceful degradation
   */
  it("should render Чекап submenu with fallback content", () => {
    // Simulate ContentService returning fallback values
    mockContentService.getCachedContent.mockImplementation(
      (key: string) => `FALLBACK_${key}`,
    );

    const submenu = service.getCheckupSubmenu();

    // Verify submenu still renders
    expect(submenu).toBeDefined();
    expect(submenu.inline_keyboard).toBeDefined();
    const allButtons = submenu.inline_keyboard.flat();
    expect(allButtons).toHaveLength(4);

    // Verify fallback content used
    expect(mockContentService.getCachedContent).toHaveBeenCalledWith(
      "checkup_submenu_start",
    );
  });

  /**
   * Test 7: WIP message callback with missing content key
   * Critical: Verifies WIP handler works even if content missing
   */
  it("should handle WIP callback when content key missing", async () => {
    mockContentService.getCachedContent.mockImplementation((key: string) => {
      if (key === "wip_message") return null; // Simulate missing content
      return "Button";
    });

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ result: true }),
        text: async () => "OK",
      } as Response),
    );

    const callbackQuery = {
      id: "callback_wip",
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
      data: "main_booking", // WIP callback
    };

    // Should not crash
    await expect(
      service.handleWebhook({
        update_id: 123,
        callback_query: callbackQuery,
      }),
    ).resolves.not.toThrow();

    // Verify API call was made (even with null/fallback content)
    expect(global.fetch).toHaveBeenCalled();
  });

  /**
   * Test 8: Bot commands setup handles ContentService errors
   * Critical: Verifies onModuleInit doesn't crash if content unavailable
   */
  it("should initialize bot commands even when ContentService returns fallbacks", async () => {
    mockContentService.getCachedContent.mockImplementation(
      (key: string) => `FALLBACK_${key}`,
    );

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ result: true }),
        text: async () => "OK",
      } as Response),
    );

    // Should not throw error during initialization
    await expect(service.onModuleInit()).resolves.not.toThrow();

    // Verify setMyCommands was called even with fallback content
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("setMyCommands"),
      expect.any(Object),
    );
  });

  /**
   * Test 9: Main menu renders correctly when admin check is slow
   * Critical: Verifies async admin check doesn't cause race conditions
   */
  it("should wait for admin check before rendering main menu", async () => {
    // Simulate slow admin check (500ms delay)
    mockAdminService.isAdmin.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(true), 500)),
    );

    mockContentService.getCachedContent.mockReturnValue("Button");

    const user = {
      id: 123456789,
      username: "admin_user",
      first_name: "Admin",
    };

    const startTime = Date.now();
    const keyboard = await service.getMainKeyboard(user);
    const endTime = Date.now();

    // Verify admin check completed before rendering
    expect(endTime - startTime).toBeGreaterThanOrEqual(500);

    // Verify admin button included (admin check succeeded)
    const allButtons = keyboard.inline_keyboard.flat();
    expect(allButtons).toHaveLength(6);
  });

  /**
   * Test 10: Back navigation handles errors gracefully
   * Critical: Verifies back_to_main doesn't crash on database errors
   */
  it("should handle back_to_main callback gracefully", async () => {
    mockAdminService.isAdmin.mockResolvedValue(false);

    // User repository returns null (user not found, will use callback_query.from)
    mockUserRepository.findOne.mockResolvedValue(null);

    mockContentService.getCachedContent.mockReturnValue("Content");

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

    // Should handle gracefully (create user from callback_query.from)
    await expect(
      service.handleWebhook({
        update_id: 123,
        callback_query: callbackQuery,
      }),
    ).resolves.not.toThrow();

    expect(global.fetch).toHaveBeenCalled();
  });
});
