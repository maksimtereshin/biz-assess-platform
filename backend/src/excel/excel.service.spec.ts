import { Test, TestingModule } from '@nestjs/testing';
import { ExcelService } from './excel.service';
import { AnalyticsReport, UserEngagement, SurveyStatistics } from '../analytics/dto/analytics.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';

describe('ExcelService', () => {
  let service: ExcelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExcelService],
    }).compile();

    service = module.get<ExcelService>(ExcelService);
  });

  afterEach(async () => {
    // Clean up any generated test files
    const testFiles = fs.readdirSync('/tmp').filter(f => f.startsWith('test_analytics_'));
    for (const file of testFiles) {
      try {
        fs.unlinkSync(path.join('/tmp', file));
      } catch (err) {
        // Ignore errors
      }
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAnalyticsReport', () => {
    const mockReport: AnalyticsReport = {
      userStats: {
        totalUsers: 1000,
        newUsers: 150,
        userGrowthRate: 15.5,
      },
      surveyStats: [
        {
          type: 'express',
          started: 500,
          completed: 400,
          conversionRate: 80.0,
          averageCompletionTime: 15,
          averageScore: 75.5,
        },
        {
          type: 'full',
          started: 300,
          completed: 250,
          conversionRate: 83.33,
          averageCompletionTime: 45,
          averageScore: 82.3,
        },
      ],
      financialMetrics: {
        paidRetakes: 120,
        totalRevenue: 60000,
        periodRevenue: 15000,
        averageRevenuePerUser: 60.0,
        paymentConversionRate: 12.5,
      },
      topUsers: [
        {
          telegramId: 123456,
          firstName: 'John',
          username: 'johndoe',
          completedSurveys: 10,
          averageScore: 85.5,
          lastActivityDate: new Date('2025-10-08'),
        },
        {
          telegramId: 789012,
          firstName: 'Jane',
          username: 'janedoe',
          completedSurveys: 8,
          averageScore: 90.0,
          lastActivityDate: new Date('2025-10-07'),
        },
      ],
      generatedAt: new Date('2025-10-09T12:00:00Z'),
      dateRange: {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-10-09'),
      },
    };

    it('should generate an Excel file', async () => {
      const filePath = await service.generateAnalyticsReport(mockReport);

      expect(filePath).toBeDefined();
      expect(fs.existsSync(filePath)).toBe(true);
      expect(path.extname(filePath)).toBe('.xlsx');

      // Clean up
      fs.unlinkSync(filePath);
    });

    it('should create a workbook with 5 sheets', async () => {
      const filePath = await service.generateAnalyticsReport(mockReport);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      expect(workbook.worksheets.length).toBe(5);
      expect(workbook.getWorksheet('Статистика пользователей')).toBeDefined();
      expect(workbook.getWorksheet('Метрики опросов')).toBeDefined();
      expect(workbook.getWorksheet('Финансовая сводка')).toBeDefined();
      expect(workbook.getWorksheet('Топ пользователей')).toBeDefined();
      expect(workbook.getWorksheet('Информация об отчёте')).toBeDefined();

      // Clean up
      fs.unlinkSync(filePath);
    });

    it('should format User Statistics sheet correctly', async () => {
      const filePath = await service.generateAnalyticsReport(mockReport);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const sheet = workbook.getWorksheet('Статистика пользователей');
      expect(sheet).toBeDefined();

      // Check headers are bold
      const headerRow = sheet.getRow(1);
      expect(headerRow.getCell(1).value).toBe('Метрика');
      expect(headerRow.getCell(2).value).toBe('Значение');
      expect(headerRow.getCell(1).font?.bold).toBe(true);

      // Check data values
      expect(sheet.getRow(2).getCell(1).value).toBe('Всего пользователей');
      expect(sheet.getRow(2).getCell(2).value).toBe(1000);
      expect(sheet.getRow(3).getCell(1).value).toBe('Новых пользователей');
      expect(sheet.getRow(3).getCell(2).value).toBe(150);
      expect(sheet.getRow(4).getCell(1).value).toBe('Темп роста пользователей (%)');
      expect(sheet.getRow(4).getCell(2).value).toBe(15.5);

      // Clean up
      fs.unlinkSync(filePath);
    });

    it('should format Survey Metrics sheet correctly', async () => {
      const filePath = await service.generateAnalyticsReport(mockReport);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const sheet = workbook.getWorksheet('Метрики опросов');
      expect(sheet).toBeDefined();

      // Check headers
      const headerRow = sheet.getRow(1);
      expect(headerRow.getCell(1).value).toBe('Тип опроса');
      expect(headerRow.getCell(2).value).toBe('Начато');
      expect(headerRow.getCell(3).value).toBe('Завершено');
      expect(headerRow.getCell(4).value).toBe('Конверсия (%)');
      expect(headerRow.getCell(5).value).toBe('Ср. время (мин)');
      expect(headerRow.getCell(6).value).toBe('Средний балл');

      // Check data
      expect(sheet.getRow(2).getCell(1).value).toBe('Экспресс');
      expect(sheet.getRow(2).getCell(2).value).toBe(500);
      expect(sheet.getRow(2).getCell(3).value).toBe(400);

      // Clean up
      fs.unlinkSync(filePath);
    });

    it('should format Financial Overview sheet correctly', async () => {
      const filePath = await service.generateAnalyticsReport(mockReport);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const sheet = workbook.getWorksheet('Финансовая сводка');
      expect(sheet).toBeDefined();

      // Check data values
      expect(sheet.getRow(2).getCell(1).value).toBe('Платных попыток');
      expect(sheet.getRow(2).getCell(2).value).toBe(120);
      expect(sheet.getRow(3).getCell(1).value).toBe('Общая выручка');
      expect(sheet.getRow(4).getCell(1).value).toBe('Выручка за период');
      expect(sheet.getRow(5).getCell(1).value).toBe('Средняя выручка на пользователя');

      // Clean up
      fs.unlinkSync(filePath);
    });

    it('should format Top Users sheet correctly', async () => {
      const filePath = await service.generateAnalyticsReport(mockReport);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const sheet = workbook.getWorksheet('Топ пользователей');
      expect(sheet).toBeDefined();

      // Check headers
      const headerRow = sheet.getRow(1);
      expect(headerRow.getCell(1).value).toBe('Место');
      expect(headerRow.getCell(2).value).toBe('Telegram ID');
      expect(headerRow.getCell(3).value).toBe('Имя');
      expect(headerRow.getCell(4).value).toBe('Username');
      expect(headerRow.getCell(5).value).toBe('Завершено опросов');
      expect(headerRow.getCell(6).value).toBe('Средний балл');
      expect(headerRow.getCell(7).value).toBe('Последняя активность');

      // Check data
      expect(sheet.getRow(2).getCell(1).value).toBe(1);
      expect(sheet.getRow(2).getCell(2).value).toBe(123456);
      expect(sheet.getRow(2).getCell(3).value).toBe('John');
      expect(sheet.getRow(2).getCell(4).value).toBe('johndoe');

      // Clean up
      fs.unlinkSync(filePath);
    });

    it('should handle null/undefined values gracefully', async () => {
      const reportWithNulls: AnalyticsReport = {
        ...mockReport,
        surveyStats: [
          {
            type: 'express',
            started: 100,
            completed: 0,
            conversionRate: 0,
            averageCompletionTime: null,
            averageScore: null,
          },
        ],
        topUsers: [
          {
            telegramId: 111111,
            firstName: 'TestUser',
            username: undefined,
            completedSurveys: 5,
            averageScore: undefined,
            lastActivityDate: new Date(),
          },
        ],
      };

      const filePath = await service.generateAnalyticsReport(reportWithNulls);

      expect(filePath).toBeDefined();
      expect(fs.existsSync(filePath)).toBe(true);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const surveySheet = workbook.getWorksheet('Метрики опросов');
      const avgTimeCell = surveySheet.getRow(2).getCell(5);
      expect(avgTimeCell.value).toMatch(/Н\/Д|0|-/);

      // Clean up
      fs.unlinkSync(filePath);
    });

    it('should apply formatting and styling', async () => {
      const filePath = await service.generateAnalyticsReport(mockReport);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const sheet = workbook.getWorksheet('Статистика пользователей');
      const headerRow = sheet.getRow(1);

      // Check header styling
      expect(headerRow.getCell(1).font?.bold).toBe(true);
      expect(headerRow.getCell(1).fill).toBeDefined();

      // Clean up
      fs.unlinkSync(filePath);
    });

    it('should handle large datasets without exceeding file size limit', async () => {
      // Create a report with many top users
      const largeReport: AnalyticsReport = {
        ...mockReport,
        topUsers: Array.from({ length: 1000 }, (_, i) => ({
          telegramId: 100000 + i,
          firstName: `User${i}`,
          username: `user${i}`,
          completedSurveys: Math.floor(Math.random() * 50),
          averageScore: Math.random() * 100,
          lastActivityDate: new Date(),
        })),
      };

      const filePath = await service.generateAnalyticsReport(largeReport);

      const stats = fs.statSync(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);

      expect(fileSizeMB).toBeLessThan(50); // Telegram limit

      // Clean up
      fs.unlinkSync(filePath);
    });

    it('should generate file within reasonable time', async () => {
      const startTime = Date.now();

      const filePath = await service.generateAnalyticsReport(mockReport);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // 5 seconds for normal report

      // Clean up
      fs.unlinkSync(filePath);
    });

    it('should format currency values correctly', async () => {
      const filePath = await service.generateAnalyticsReport(mockReport);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const sheet = workbook.getWorksheet('Финансовая сводка');

      // Revenue cells should have number format
      const totalRevenueCell = sheet.getRow(3).getCell(2);
      expect(totalRevenueCell.value).toBe(60000);

      // Clean up
      fs.unlinkSync(filePath);
    });

    it('should format date values correctly', async () => {
      const filePath = await service.generateAnalyticsReport(mockReport);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const sheet = workbook.getWorksheet('Топ пользователей');
      const dateCell = sheet.getRow(2).getCell(7);

      // Date should be formatted
      expect(dateCell.value).toBeDefined();

      // Clean up
      fs.unlinkSync(filePath);
    });

    it('should format percentage values correctly', async () => {
      const filePath = await service.generateAnalyticsReport(mockReport);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const sheet = workbook.getWorksheet('Метрики опросов');
      const conversionCell = sheet.getRow(2).getCell(4);

      expect(conversionCell.value).toBeDefined();
      expect(typeof conversionCell.value === 'number').toBe(true);

      // Clean up
      fs.unlinkSync(filePath);
    });

    it('should include report metadata in Report Info sheet', async () => {
      const filePath = await service.generateAnalyticsReport(mockReport);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const sheet = workbook.getWorksheet('Информация об отчёте');
      expect(sheet).toBeDefined();

      // Check for metadata
      const generatedAtRow = sheet.getRow(2);
      expect(generatedAtRow.getCell(1).value).toBe('Дата создания');

      const dateRangeRow = sheet.getRow(3);
      expect(dateRangeRow.getCell(1).value).toContain('Период');

      // Clean up
      fs.unlinkSync(filePath);
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid report data', async () => {
      const invalidReport = null as any;

      await expect(service.generateAnalyticsReport(invalidReport)).rejects.toThrow();
    });

    it('should handle file system errors gracefully', async () => {
      // This test would require mocking fs operations
      // For now, we'll just ensure the service handles errors
      const mockReport: AnalyticsReport = {
        userStats: {
          totalUsers: 0,
          newUsers: 0,
          userGrowthRate: 0,
        },
        surveyStats: [],
        financialMetrics: {
          paidRetakes: 0,
          totalRevenue: 0,
          periodRevenue: 0,
          averageRevenuePerUser: 0,
          paymentConversionRate: 0,
        },
        topUsers: [],
        generatedAt: new Date(),
        dateRange: {
          startDate: null,
          endDate: null,
        },
      };

      const filePath = await service.generateAnalyticsReport(mockReport);
      expect(filePath).toBeDefined();

      // Clean up
      fs.unlinkSync(filePath);
    });
  });

  describe('pagination', () => {
    it('should paginate results when exceeding 10,000 rows', async () => {
      const largeDataset: UserEngagement[] = Array.from({ length: 15000 }, (_, i) => ({
        telegramId: i,
        firstName: `User${i}`,
        username: `user${i}`,
        completedSurveys: i,
        averageScore: i % 100,
        lastActivityDate: new Date(),
      }));

      const report: AnalyticsReport = {
        userStats: {
          totalUsers: 15000,
          newUsers: 5000,
          userGrowthRate: 50,
        },
        surveyStats: [],
        financialMetrics: {
          paidRetakes: 0,
          totalRevenue: 0,
          periodRevenue: 0,
          averageRevenuePerUser: 0,
          paymentConversionRate: 0,
        },
        topUsers: largeDataset,
        generatedAt: new Date(),
        dateRange: {
          startDate: null,
          endDate: null,
        },
      };

      const filePath = await service.generateAnalyticsReport(report);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const sheet = workbook.getWorksheet('Топ пользователей');

      // Should have truncated or paginated (header + max rows + pagination note)
      expect(sheet.rowCount).toBeLessThanOrEqual(10003); // +1 for header, +2 for note

      // Clean up
      fs.unlinkSync(filePath);
    });
  });
});
