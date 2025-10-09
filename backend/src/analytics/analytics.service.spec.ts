import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AnalyticsService } from './analytics.service';
import { User } from '../entities/user.entity';
import { SurveySession } from '../entities/survey-session.entity';
import { Payment } from '../entities/payment.entity';
import { Answer } from '../entities/answer.entity';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let userRepository: Repository<User>;
  let sessionRepository: Repository<SurveySession>;
  let paymentRepository: Repository<Payment>;
  let answerRepository: Repository<Answer>;

  const mockUserRepository = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
  };

  const mockSessionRepository = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
  };

  const mockPaymentRepository = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
    sum: jest.fn(),
  };

  const mockAnswerRepository = {
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(SurveySession),
          useValue: mockSessionRepository,
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepository,
        },
        {
          provide: getRepositoryToken(Answer),
          useValue: mockAnswerRepository,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    sessionRepository = module.get<Repository<SurveySession>>(
      getRepositoryToken(SurveySession),
    );
    paymentRepository = module.get<Repository<Payment>>(
      getRepositoryToken(Payment),
    );
    answerRepository = module.get<Repository<Answer>>(
      getRepositoryToken(Answer),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.clearCache();
  });

  describe('User Statistics', () => {
    describe('getTotalUsers', () => {
      it('should return total count of all users', async () => {
        service.clearCache();
        jest.clearAllMocks();

        mockUserRepository.count.mockResolvedValue(150);

        const result = await service.getTotalUsers();

        expect(result).toBe(150);
        expect(mockUserRepository.count).toHaveBeenCalledTimes(1);
      });

      it('should return 0 when no users exist', async () => {
        service.clearCache();
        jest.clearAllMocks();

        mockUserRepository.count.mockResolvedValue(0);

        const result = await service.getTotalUsers();

        expect(result).toBe(0);
      });
    });

    describe('getNewUsers', () => {
      it('should return count of users created within date range', async () => {
        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-01-31');
        mockUserRepository.count.mockResolvedValue(25);

        const result = await service.getNewUsers(startDate, endDate);

        expect(result).toBe(25);
        expect(mockUserRepository.count).toHaveBeenCalledWith({
          where: {
            created_at: Between(startDate, endDate),
          },
        });
      });

      it('should return 0 for date range with no users', async () => {
        const startDate = new Date('2020-01-01');
        const endDate = new Date('2020-01-31');
        mockUserRepository.count.mockResolvedValue(0);

        const result = await service.getNewUsers(startDate, endDate);

        expect(result).toBe(0);
      });
    });

    describe('getUserGrowthRate', () => {
      it('should calculate growth rate correctly', async () => {
        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-01-31');

        // Mock 100 users before start date, 20 new users in period
        mockUserRepository.count
          .mockResolvedValueOnce(100) // Users before start
          .mockResolvedValueOnce(20); // New users in period

        const result = await service.getUserGrowthRate(startDate, endDate);

        expect(result).toBe(20); // 20/100 * 100 = 20%
      });

      it('should return 0 when no users existed before period', async () => {
        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-01-31');

        mockUserRepository.count
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(50);

        const result = await service.getUserGrowthRate(startDate, endDate);

        expect(result).toBe(0);
      });

      it('should handle low growth period', async () => {
        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-01-31');

        // Clear service cache
        service.clearCache();
        // Clear previous mocks
        mockUserRepository.count.mockReset();

        mockUserRepository.count
          .mockResolvedValueOnce(100) // Users before
          .mockResolvedValueOnce(5); // Only 5 new users

        const result = await service.getUserGrowthRate(startDate, endDate);

        expect(result).toBe(5); // 5/100 * 100 = 5%
      });
    });
  });

  describe('Survey Metrics', () => {
    describe('getSurveyStats', () => {
      it('should return survey statistics for given type and date range', async () => {
        const type = 'EXPRESS';
        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-01-31');

        const mockQueryBuilder = {
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getCount: jest.fn(),
          clone: jest.fn(),
        };

        // Clone returns a copy of the query builder
        mockQueryBuilder.clone.mockReturnValue({
          ...mockQueryBuilder,
          andWhere: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(40),
        });

        mockSessionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        // First call for started count
        mockQueryBuilder.getCount.mockResolvedValueOnce(50);

        const result = await service.getSurveyStats(type, startDate, endDate);

        expect(result.started).toBe(50);
        expect(result.completed).toBe(40);
      });

      it('should handle no surveys in period', async () => {
        const type = 'FULL';
        const startDate = new Date('2020-01-01');
        const endDate = new Date('2020-01-31');

        const mockQueryBuilder = {
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getCount: jest.fn(),
          clone: jest.fn(),
        };

        mockQueryBuilder.clone.mockReturnValue({
          ...mockQueryBuilder,
          andWhere: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(0),
        });

        mockSessionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.getCount.mockResolvedValueOnce(0);

        const result = await service.getSurveyStats(type, startDate, endDate);

        expect(result.started).toBe(0);
        expect(result.completed).toBe(0);
      });
    });

    describe('getConversionRate', () => {
      it('should calculate conversion rate correctly', async () => {
        const type = 'EXPRESS';
        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-01-31');

        mockSessionRepository.count
          .mockResolvedValueOnce(100) // Started
          .mockResolvedValueOnce(80);  // Completed

        const result = await service.getConversionRate(type, startDate, endDate);

        expect(result).toBe(80); // 80/100 * 100 = 80%
      });

      it('should return 0 when no surveys started', async () => {
        const type = 'FULL';
        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-01-31');

        mockSessionRepository.count
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(0);

        const result = await service.getConversionRate(type, startDate, endDate);

        expect(result).toBe(0);
      });
    });

    describe('getAverageCompletionTime', () => {
      it('should calculate average time between created and updated timestamps', async () => {
        const type = 'EXPRESS';

        const mockSessions = [
          {
            created_at: new Date('2025-01-01T10:00:00Z'),
            updated_at: new Date('2025-01-01T10:15:00Z'), // 15 minutes
          },
          {
            created_at: new Date('2025-01-01T11:00:00Z'),
            updated_at: new Date('2025-01-01T11:25:00Z'), // 25 minutes
          },
        ];

        const mockQueryBuilder = {
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(mockSessions),
        };

        mockSessionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        const result = await service.getAverageCompletionTime(type);

        expect(result).toBe(20); // Average of 15 and 25 minutes
      });

      it('should return null when no completed surveys', async () => {
        const type = 'FULL';

        const mockQueryBuilder = {
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        };

        mockSessionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        const result = await service.getAverageCompletionTime(type);

        expect(result).toBeNull();
      });
    });

    describe('getAverageScores', () => {
      it('should calculate average score across all answers', async () => {
        const type = 'EXPRESS';
        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-01-31');

        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ avg: '7.5' }),
        };

        mockAnswerRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        const result = await service.getAverageScores(type, startDate, endDate);

        expect(result).toBe(7.5);
      });

      it('should return null when no answers exist', async () => {
        const type = 'FULL';
        const startDate = new Date('2020-01-01');
        const endDate = new Date('2020-01-31');

        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ avg: null }),
        };

        mockAnswerRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        const result = await service.getAverageScores(type, startDate, endDate);

        expect(result).toBeNull();
      });
    });
  });

  describe('Financial Metrics', () => {
    describe('getPaidRetakes', () => {
      it('should count successful payments for survey sessions', async () => {
        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-01-31');

        mockPaymentRepository.count.mockResolvedValue(15);

        const result = await service.getPaidRetakes(startDate, endDate);

        expect(result).toBe(15);
      });

      it('should return 0 when no paid retakes', async () => {
        const startDate = new Date('2020-01-01');
        const endDate = new Date('2020-01-31');

        mockPaymentRepository.count.mockResolvedValue(0);

        const result = await service.getPaidRetakes(startDate, endDate);

        expect(result).toBe(0);
      });
    });

    describe('getTotalRevenue', () => {
      it('should sum all successful payment amounts', async () => {
        service.clearCache();
        jest.clearAllMocks();

        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ total: '15000' }),
        };

        mockPaymentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        const result = await service.getTotalRevenue();

        expect(result).toBe(15000);
      });

      it('should return 0 when no payments exist', async () => {
        service.clearCache();
        jest.clearAllMocks();

        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ total: null }),
        };

        mockPaymentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        const result = await service.getTotalRevenue();

        expect(result).toBe(0);
      });
    });

    describe('getPeriodRevenue', () => {
      it('should sum payments within date range', async () => {
        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-01-31');

        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ total: '5000' }),
        };

        mockPaymentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        const result = await service.getPeriodRevenue(startDate, endDate);

        expect(result).toBe(5000);
      });
    });

    describe('getAverageRevenuePerUser', () => {
      it('should calculate revenue divided by user count', async () => {
        // Clear service cache
        service.clearCache();
        mockUserRepository.count.mockReset();
        mockPaymentRepository.createQueryBuilder.mockReset();

        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ total: '10000' }),
        };

        mockPaymentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockUserRepository.count.mockResolvedValue(100);

        const result = await service.getAverageRevenuePerUser();

        expect(result).toBe(100); // 10000/100
      });

      it('should return 0 when no users', async () => {
        service.clearCache();
        jest.clearAllMocks();

        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ total: '10000' }),
        };

        mockPaymentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockUserRepository.count.mockResolvedValue(0);

        const result = await service.getAverageRevenuePerUser();

        expect(result).toBe(0);
      });
    });

    describe('getPaymentConversionRate', () => {
      it('should calculate percentage of users who made payments', async () => {
        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          distinct: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ count: '30' }),
        };

        mockPaymentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockUserRepository.count.mockResolvedValue(100);

        const result = await service.getPaymentConversionRate();

        expect(result).toBe(30); // 30/100 * 100
      });

      it('should return 0 when no users', async () => {
        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          distinct: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ count: '0' }),
        };

        mockPaymentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockUserRepository.count.mockResolvedValue(0);

        const result = await service.getPaymentConversionRate();

        expect(result).toBe(0);
      });
    });
  });

  describe('Engagement Rankings', () => {
    describe('getMostActiveUsers', () => {
      it('should return top users by completion count', async () => {
        const limit = 10;

        const mockUsers = [
          {
            telegram_id: 12345,
            first_name: 'John',
            username: 'john_doe',
            completedCount: 15,
            lastActivity: new Date('2025-01-15'),
          },
          {
            telegram_id: 67890,
            first_name: 'Jane',
            username: 'jane_smith',
            completedCount: 12,
            lastActivity: new Date('2025-01-14'),
          },
        ];

        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          addGroupBy: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue(mockUsers),
        };

        mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        const result = await service.getMostActiveUsers(limit);

        expect(result).toHaveLength(2);
        expect(result[0].completedSurveys).toBe(15);
        expect(mockQueryBuilder.limit).toHaveBeenCalledWith(limit);
      });

      it('should return empty array when no users', async () => {
        const limit = 10;

        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          addGroupBy: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        };

        mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        const result = await service.getMostActiveUsers(limit);

        expect(result).toEqual([]);
      });
    });

    describe('getTopScoringUsers', () => {
      it('should return users with highest average scores', async () => {
        const limit = 10;

        const mockUsers = [
          {
            telegram_id: 12345,
            first_name: 'John',
            username: 'john_doe',
            avgScore: 9.5,
            completedCount: 5,
            lastActivity: new Date('2025-01-15'),
          },
          {
            telegram_id: 67890,
            first_name: 'Jane',
            username: 'jane_smith',
            avgScore: 9.2,
            completedCount: 8,
            lastActivity: new Date('2025-01-14'),
          },
        ];

        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          addGroupBy: jest.fn().mockReturnThis(),
          having: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue(mockUsers),
        };

        mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        const result = await service.getTopScoringUsers(limit);

        expect(result).toHaveLength(2);
        expect(result[0].averageScore).toBe(9.5);
        expect(mockQueryBuilder.limit).toHaveBeenCalledWith(limit);
      });
    });

    describe('getUsersWithMostCompletions', () => {
      it('should return same as getMostActiveUsers', async () => {
        const limit = 20;

        const mockUsers = [
          {
            telegram_id: 12345,
            first_name: 'John',
            username: 'john_doe',
            completedCount: 25,
            lastActivity: new Date('2025-01-15'),
          },
        ];

        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          addGroupBy: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue(mockUsers),
        };

        mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        const result = await service.getUsersWithMostCompletions(limit);

        expect(result).toHaveLength(1);
        expect(result[0].completedSurveys).toBe(25);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null date parameters gracefully', async () => {
      mockUserRepository.count.mockResolvedValue(10);

      const result = await service.getNewUsers(null, null);

      expect(mockUserRepository.count).toHaveBeenCalled();
    });

    it('should handle invalid survey type', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn(),
        clone: jest.fn(),
      };

      mockQueryBuilder.clone.mockReturnValue({
        ...mockQueryBuilder,
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      });

      mockSessionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getCount.mockResolvedValueOnce(0);

      const result = await service.getSurveyStats(
        'INVALID_TYPE',
        new Date(),
        new Date(),
      );

      expect(result.started).toBe(0);
      expect(result.completed).toBe(0);
    });

    it('should handle empty database gracefully', async () => {
      mockUserRepository.count.mockResolvedValue(0);
      mockSessionRepository.count.mockResolvedValue(0);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: null }),
      };

      mockPaymentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const totalUsers = await service.getTotalUsers();
      const totalRevenue = await service.getTotalRevenue();

      expect(totalUsers).toBe(0);
      expect(totalRevenue).toBe(0);
    });
  });
});
