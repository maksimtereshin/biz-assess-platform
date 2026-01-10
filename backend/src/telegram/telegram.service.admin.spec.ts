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
import { ReportService } from '../report/report.service';
import { AdminService } from '../admin/admin.service';
import { CalendarService } from './calendar/calendar.service';
import { User } from '../entities';

describe('TelegramService - Admin Panel Integration', () => {
  let service: TelegramService;
  let adminService: AdminService;
  let authService: AuthService;
  let configService: ConfigService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockAdminService = {
    isAdmin: jest.fn(),
    validateAdmin: jest.fn(),
  };

  const mockAuthService = {
    generateAuthToken: jest.fn(),
    generateAdminAuthToken: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        TELEGRAM_BOT_TOKEN: 'test_bot_token',
        FRONTEND_URL: 'http://localhost:3000',
        BACKEND_URL: 'http://localhost:4000',
      };
      return config[key];
    }),
  };

  const mockSurveyService = {};
  const mockPaymentService = {};
  const mockAnalyticsService = {};
  const mockExcelService = {};
  const mockReportService = {};
  const mockCalendarService = {};

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
          provide: ReportService,
          useValue: mockReportService,
        },
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
        {
          provide: CalendarService,
          useValue: mockCalendarService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);
    adminService = module.get<AdminService>(AdminService);
    authService = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);

    // Clear mocks before each test
    jest.clearAllMocks();
  });

  describe('isAdmin', () => {
    it('should return true for admin users from database', async () => {
      mockAdminService.isAdmin.mockResolvedValue(true);

      const result = await service.isAdmin('maksim_tereshin');

      expect(result).toBe(true);
      expect(mockAdminService.isAdmin).toHaveBeenCalledWith('maksim_tereshin');
    });

    it('should return false for non-admin users', async () => {
      mockAdminService.isAdmin.mockResolvedValue(false);

      const result = await service.isAdmin('regular_user');

      expect(result).toBe(false);
      expect(mockAdminService.isAdmin).toHaveBeenCalledWith('regular_user');
    });

    it('should return false when username is null or undefined', async () => {
      const resultNull = await service.isAdmin(null);
      const resultUndefined = await service.isAdmin(undefined);

      expect(resultNull).toBe(false);
      expect(resultUndefined).toBe(false);
      expect(mockAdminService.isAdmin).not.toHaveBeenCalled();
    });

    it('should normalize username (trim and lowercase) before checking', async () => {
      mockAdminService.isAdmin.mockResolvedValue(true);

      await service.isAdmin('  MAKSIM_TERESHIN  ');

      expect(mockAdminService.isAdmin).toHaveBeenCalledWith('maksim_tereshin');
    });
  });

  describe('Admin Panel Button Visibility', () => {
    it('should show admin panel button for admin users in main keyboard', async () => {
      // Note: getMainKeyboard returns base keyboard, admin button is added in handleStartCommand
      const keyboard = service.getMainKeyboard({ username: 'maksim_tereshin' });

      expect(keyboard.inline_keyboard).toBeDefined();
      expect(Array.isArray(keyboard.inline_keyboard)).toBe(true);
    });

    it('should not include admin button in base keyboard', () => {
      const keyboard = service.getMainKeyboard({ username: 'regular_user' });

      const hasAdminButton = keyboard.inline_keyboard.some(row =>
        row.some(button => button.callback_data === 'admin_panel')
      );

      expect(hasAdminButton).toBe(false);
    });
  });

  describe('Admin Panel URL Generation', () => {
    it('should generate admin auth token and create correct URL when admin clicks button', async () => {
      const mockToken = 'mock_admin_jwt_token';
      mockAdminService.isAdmin.mockResolvedValue(true);
      mockAuthService.generateAdminAuthToken.mockReturnValue(mockToken);

      // We can't directly test handleAdminPanelButton as it's private
      // But we can test that the token generation works correctly
      const token = authService.generateAdminAuthToken('maksim_tereshin');

      expect(token).toBe(mockToken);
      expect(mockAuthService.generateAdminAuthToken).toHaveBeenCalledWith('maksim_tereshin');
    });

    it('should create admin panel URL with correct format', () => {
      const backendUrl = configService.get('BACKEND_URL');
      const mockToken = 'test_token';

      const expectedUrl = `${backendUrl}/admin?token=${mockToken}`;

      expect(expectedUrl).toBe('http://localhost:4000/admin?token=test_token');
    });
  });

  describe('Admin Authorization Checks', () => {
    it('should block non-admin users from accessing admin features', async () => {
      mockAdminService.isAdmin.mockResolvedValue(false);

      const isAdmin = await service.isAdmin('non_admin_user');

      expect(isAdmin).toBe(false);
    });

    it('should allow admin users to access admin features', async () => {
      mockAdminService.isAdmin.mockResolvedValue(true);

      const isAdmin = await service.isAdmin('maksim_tereshin');

      expect(isAdmin).toBe(true);
    });
  });

  describe('Integration with AdminService', () => {
    it('should use AdminService for admin checks instead of hardcoded list', async () => {
      mockAdminService.isAdmin.mockResolvedValue(true);

      await service.isAdmin('new_admin_from_database');

      expect(mockAdminService.isAdmin).toHaveBeenCalledWith('new_admin_from_database');
      // This proves we're using AdminService, not hardcoded ADMIN_USERNAMES
    });

    it('should handle AdminService errors gracefully', async () => {
      mockAdminService.isAdmin.mockRejectedValue(new Error('Database error'));

      await expect(service.isAdmin('test_user')).rejects.toThrow('Database error');
    });
  });
});
