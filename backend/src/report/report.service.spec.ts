import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from './report.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Report, SurveySession, Answer } from '../entities';
import { PdfGenerator } from '../common/utils/pdf-generator.util';
import { AnalyticsCalculator } from '../common/utils/analytics-calculator.util';
import { QueryCacheService } from '../common/services/query-cache.service';
import { NotFoundException } from '@nestjs/common';
import { AnalyticsResult, PaymentStatus, SurveyResults } from 'bizass-shared';

describe('ReportService', () => {
  let service: ReportService;
  let reportRepository: Repository<Report>;
  let sessionRepository: Repository<SurveySession>;
  let answerRepository: Repository<Answer>;
  let pdfGenerator: PdfGenerator;
  let analyticsCalculator: AnalyticsCalculator;
  let cacheService: QueryCacheService;

  const mockSession = {
    id: 'test-session-id',
    user_telegram_id: 12345,
    survey: {
      id: 'survey-1',
      type: 'express',
      structure: {
        categories: [
          {
            id: 'cat1',
            name: 'Category 1',
            subcategories: [{ id: 'sub1', name: 'Sub 1' }],
          },
        ],
      },
    },
    answers: [
      { question_id: 1, score: 8 },
      { question_id: 2, score: 7 },
    ],
    completed_at: new Date(),
  };


  const mockAnalytics: AnalyticsResult = {
    overallScore: 85,
    totalQuestions: 2,
    answeredQuestions: 2,
    categoryScores: { cat1: 85 },
    subcategoryScores: { sub1: 85 },
  };

  const mockSurveyResults: SurveyResults = {
    sessionId: 'test-session-id',
    surveyType: 'express',
    overallScore: 85,
    overallContent: {
      category: 'Overall',
      subcategory: '',
      titleSummary: 'Test Summary',
      result: 'Good',
      resultDescription: 'Good performance',
      min: 0,
      max: 100,
      color: '#4CAF50',
    },
    categories: [
      {
        name: 'Category 1',
        score: 85,
        content: {
          category: 'Category 1',
          subcategory: '',
          titleSummary: 'Category Summary',
          result: 'Good',
          resultDescription: 'Good category performance',
          min: 0,
          max: 100,
          color: '#4CAF50',
        },
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: getRepositoryToken(Report),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SurveySession),
          useValue: {
            findOne: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Answer),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: PdfGenerator,
          useValue: {
            createPdf: jest.fn(),
          },
        },
        {
          provide: AnalyticsCalculator,
          useValue: {
            calculateScores: jest.fn().mockReturnValue(mockAnalytics),
            generateFreeVersionData: jest.fn().mockResolvedValue(mockSurveyResults),
            generatePaidVersionData: jest.fn().mockResolvedValue(mockSurveyResults),
            getPieChartData: jest.fn().mockReturnValue({
              labels: ['Category 1'],
              data: [85],
              colors: ['#4CAF50'],
            }),
          },
        },
        {
          provide: QueryCacheService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined),
            set: jest.fn(),
            getOrCompute: jest.fn().mockImplementation((key, fn) => fn()),
            invalidate: jest.fn(),
            invalidatePattern: jest.fn(),
            clear: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    reportRepository = module.get<Repository<Report>>(getRepositoryToken(Report));
    sessionRepository = module.get<Repository<SurveySession>>(
      getRepositoryToken(SurveySession),
    );
    answerRepository = module.get<Repository<Answer>>(getRepositoryToken(Answer));
    pdfGenerator = module.get<PdfGenerator>(PdfGenerator);
    analyticsCalculator = module.get<AnalyticsCalculator>(AnalyticsCalculator);
    cacheService = module.get<QueryCacheService>(QueryCacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateReport - On-Demand PDF Generation', () => {
    it('should generate PDF on-demand and return buffer without storing', async () => {
      // Arrange
      const sessionId = 'test-session-id';
      const pdfBuffer = Buffer.from('mock-pdf-data');

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockSession),
      };

      jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      (analyticsCalculator.generateFreeVersionData as jest.Mock).mockResolvedValue(mockSurveyResults);
      jest.spyOn(pdfGenerator, 'createPdf').mockResolvedValue(pdfBuffer);

      // Act
      const result = await service.generateReport(sessionId, false);

      // Assert
      expect(sessionRepository.createQueryBuilder).toHaveBeenCalled();
      expect(analyticsCalculator.generateFreeVersionData).toHaveBeenCalled();
      expect(pdfGenerator.createPdf).toHaveBeenCalledWith(mockSurveyResults, false);
      expect(result).toEqual(pdfBuffer);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should throw NotFoundException when session does not exist', async () => {
      // Arrange
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      // Act & Assert
      await expect(service.generateReport('invalid-id', false)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.generateReport('invalid-id', false)).rejects.toThrow(
        'Session invalid-id not found',
      );
    });

    it('should handle PDF generation errors gracefully', async () => {
      // Arrange
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockSession),
      };

      jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(analyticsCalculator, 'calculateScores').mockReturnValue(mockAnalytics);
      jest.spyOn(pdfGenerator, 'createPdf').mockRejectedValue(new Error('PDF generation failed'));

      // Act & Assert
      await expect(service.generateReport('test-session-id', false)).rejects.toThrow(
        'PDF generation failed',
      );
    });
  });

  describe('generateReport - Free vs Paid Logic', () => {
    it('should generate free version PDF when isPaid is false', async () => {
      // Arrange
      const pdfBuffer = Buffer.from('free-pdf-data');
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockSession),
      };

      jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(analyticsCalculator, 'calculateScores').mockReturnValue(mockAnalytics);
      jest.spyOn(pdfGenerator, 'createPdf').mockResolvedValue(pdfBuffer);

      // Act
      const result = await service.generateReport('test-session-id', false);

      // Assert
      expect(pdfGenerator.createPdf).toHaveBeenCalledWith(mockSurveyResults, false);
      expect(result).toEqual(pdfBuffer);
    });

    it('should generate paid version PDF when isPaid is true', async () => {
      // Arrange
      const pdfBuffer = Buffer.from('paid-pdf-data');
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockSession),
      };

      jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      (analyticsCalculator.generatePaidVersionData as jest.Mock).mockResolvedValue(mockSurveyResults);
      jest.spyOn(pdfGenerator, 'createPdf').mockResolvedValue(pdfBuffer);

      // Act
      const result = await service.generateReport('test-session-id', true);

      // Assert
      expect(analyticsCalculator.generatePaidVersionData).toHaveBeenCalled();
      expect(pdfGenerator.createPdf).toHaveBeenCalledWith(mockSurveyResults, true);
      expect(result).toEqual(pdfBuffer);
    });
  });

  describe('generateReport - Memory Streaming', () => {
    it('should handle large PDFs without memory issues', async () => {
      // Arrange
      // Simulate a large PDF (5MB)
      const largePdfBuffer = Buffer.alloc(5 * 1024 * 1024, 'a');
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockSession),
      };

      jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(analyticsCalculator, 'calculateScores').mockReturnValue(mockAnalytics);
      jest.spyOn(pdfGenerator, 'createPdf').mockResolvedValue(largePdfBuffer);

      // Act
      const result = await service.generateReport('test-session-id', false);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(5 * 1024 * 1024);
      expect(pdfGenerator.createPdf).toHaveBeenCalledTimes(1);
    });

    it('should return buffer directly for streaming to client', async () => {
      // Arrange
      const pdfBuffer = Buffer.from('streaming-pdf-data');
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockSession),
      };

      jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(analyticsCalculator, 'calculateScores').mockReturnValue(mockAnalytics);
      jest.spyOn(pdfGenerator, 'createPdf').mockResolvedValue(pdfBuffer);

      // Act
      const result = await service.generateReport('test-session-id', false);

      // Assert
      expect(result).toEqual(pdfBuffer);
      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });

  describe('generateReport - Concurrent Generation', () => {
    it('should handle multiple concurrent PDF generation requests', async () => {
      // Arrange
      const sessionIds = ['session-1', 'session-2', 'session-3'];
      const pdfBuffer = Buffer.from('concurrent-pdf');

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockSession),
      };

      jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      (analyticsCalculator.generateFreeVersionData as jest.Mock).mockResolvedValue(mockSurveyResults);
      jest.spyOn(pdfGenerator, 'createPdf').mockResolvedValue(pdfBuffer);

      // Act
      const promises = sessionIds.map((id) => service.generateReport(id, false));
      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toEqual(pdfBuffer);
      });
      expect(pdfGenerator.createPdf).toHaveBeenCalledTimes(3);
    });
  });

  describe('getUserCompletedSessionsCount', () => {
    it('should count only completed sessions for a user', async () => {
      // Arrange
      const userId = 12345;
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(3),
      };

      jest
        .spyOn(sessionRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      // Act
      const count = await service.getUserCompletedSessionsCount(userId);

      // Assert
      expect(count).toBe(3);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'session.user_telegram_id = :userId',
        { userId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('session.status = :status', { status: 'COMPLETED' });
    });

    it('should return 0 when user has no completed sessions', async () => {
      // Arrange
      const userId = 99999;
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };

      jest
        .spyOn(sessionRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      // Act
      const count = await service.getUserCompletedSessionsCount(userId);

      // Assert
      expect(count).toBe(0);
    });
  });

  describe('isReportFree', () => {
    it('should return true when user has exactly 1 completed session', async () => {
      // Arrange
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };

      jest
        .spyOn(sessionRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      // Act
      const isFree = await service.isReportFree(12345);

      // Assert
      expect(isFree).toBe(true);
    });

    it('should return false when user has multiple completed sessions', async () => {
      // Arrange
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      };

      jest
        .spyOn(sessionRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      // Act
      const isFree = await service.isReportFree(12345);

      // Assert
      expect(isFree).toBe(false);
    });
  });

  describe('hasUserPaidForSession', () => {
    it('should return true when session has associated paid report', async () => {
      // Arrange
      const mockReport = {
        id: 'report-1',
        session_id: 'session-1',
        payment_status: PaymentStatus.PAID,
      };

      jest.spyOn(reportRepository, 'findOne').mockResolvedValue(mockReport as any);

      // Act
      const hasPaid = await service.hasUserPaidForSession('session-1');

      // Assert
      expect(hasPaid).toBe(true);
      expect(reportRepository.findOne).toHaveBeenCalledWith({
        where: {
          session_id: 'session-1',
          payment_status: PaymentStatus.PAID,
        },
      });
    });

    it('should return false when session has no paid report', async () => {
      // Arrange
      jest.spyOn(reportRepository, 'findOne').mockResolvedValue(null);

      // Act
      const hasPaid = await service.hasUserPaidForSession('session-1');

      // Assert
      expect(hasPaid).toBe(false);
    });
  });

  describe('Integration - Full Report Generation Flow', () => {
    it('should complete full report generation workflow', async () => {
      // Arrange
      const sessionId = 'integration-test-session';
      const userId = 12345;
      const pdfBuffer = Buffer.from('integration-pdf');

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          ...mockSession,
          id: sessionId,
          user_telegram_id: userId,
        }),
      };

      jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      (analyticsCalculator.generateFreeVersionData as jest.Mock).mockResolvedValue(mockSurveyResults);
      jest.spyOn(pdfGenerator, 'createPdf').mockResolvedValue(pdfBuffer);

      // Act
      const result = await service.generateReport(sessionId, false);

      // Assert
      expect(sessionRepository.createQueryBuilder).toHaveBeenCalled();
      expect(analyticsCalculator.generateFreeVersionData).toHaveBeenCalled();
      expect(pdfGenerator.createPdf).toHaveBeenCalled();
      expect(result).toEqual(pdfBuffer);
    });
  });
});
