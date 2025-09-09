import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { Survey, SurveySession, Answer, User } from '../entities';
import { SurveyType, SessionStatus } from 'bizass-shared';

describe('SurveyService', () => {
  let service: SurveyService;
  let surveyRepository: Repository<Survey>;
  let sessionRepository: Repository<SurveySession>;
  let answerRepository: Repository<Answer>;
  let userRepository: Repository<User>;

  const mockSurveyRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };

  const mockSessionRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };

  const mockAnswerRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SurveyService,
        {
          provide: getRepositoryToken(Survey),
          useValue: mockSurveyRepository,
        },
        {
          provide: getRepositoryToken(SurveySession),
          useValue: mockSessionRepository,
        },
        {
          provide: getRepositoryToken(Answer),
          useValue: mockAnswerRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<SurveyService>(SurveyService);
    surveyRepository = module.get<Repository<Survey>>(getRepositoryToken(Survey));
    sessionRepository = module.get<Repository<SurveySession>>(getRepositoryToken(SurveySession));
    answerRepository = module.get<Repository<Answer>>(getRepositoryToken(Answer));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNewSession', () => {
    const userId = 12345;
    const surveyType = SurveyType.EXPRESS;
    const mockSurvey = {
      id: 1,
      type: SurveyType.EXPRESS,
      name: 'Express Survey',
      structure: {},
    };
    const mockUser = {
      telegram_id: userId,
      first_name: 'Test User',
      username: 'testuser',
    };

    it('should create a new session when user exists', async () => {
      const mockSession = {
        id: 'session-uuid',
        user_telegram_id: userId,
        survey_id: 1,
        status: SessionStatus.IN_PROGRESS,
        created_at: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockSurveyRepository.findOne.mockResolvedValue(mockSurvey);
      mockSessionRepository.create.mockReturnValue(mockSession);
      mockSessionRepository.save.mockResolvedValue(mockSession);

      const result = await service.createNewSession(userId, surveyType);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { telegram_id: userId } });
      expect(mockSurveyRepository.findOne).toHaveBeenCalledWith({ where: { type: surveyType } });
      expect(mockSessionRepository.create).toHaveBeenCalledWith({
        id: expect.any(String),
        user_telegram_id: userId,
        survey_id: mockSurvey.id,
        status: SessionStatus.IN_PROGRESS,
      });
      expect(result).toEqual({
        id: mockSession.id,
        userId: mockSession.user_telegram_id,
        surveyType: surveyType,
        status: SessionStatus.IN_PROGRESS,
        answers: {},
        createdAt: mockSession.created_at.toISOString(),
      });
    });

    it('should create user and session when user does not exist', async () => {
      const mockNewUser = { ...mockUser };
      const mockSession = {
        id: 'session-uuid',
        user_telegram_id: userId,
        survey_id: 1,
        status: SessionStatus.IN_PROGRESS,
        created_at: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockNewUser);
      mockUserRepository.save.mockResolvedValue(mockNewUser);
      mockSurveyRepository.findOne.mockResolvedValue(mockSurvey);
      mockSessionRepository.create.mockReturnValue(mockSession);
      mockSessionRepository.save.mockResolvedValue(mockSession);

      const result = await service.createNewSession(userId, surveyType);

      expect(mockUserRepository.create).toHaveBeenCalledWith({
        telegram_id: userId,
        first_name: 'Unknown',
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockNewUser);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when survey type is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockSurveyRepository.findOne.mockResolvedValue(null);

      await expect(service.createNewSession(userId, surveyType)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('saveAnswer', () => {
    const sessionId = 'session-uuid';
    const questionId = 1;
    const score = 8;

    it('should save a new answer', async () => {
      const mockSession = {
        id: sessionId,
        user_telegram_id: 12345,
        survey_id: 1,
        status: SessionStatus.IN_PROGRESS,
      };
      const mockAnswer = {
        session_id: sessionId,
        question_id: questionId,
        score,
        created_at: new Date(),
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession);
      mockAnswerRepository.findOne.mockResolvedValue(null);
      mockAnswerRepository.create.mockReturnValue(mockAnswer);
      mockAnswerRepository.save.mockResolvedValue(mockAnswer);

      await service.saveAnswer(sessionId, questionId, score);

      expect(mockSessionRepository.findOne).toHaveBeenCalledWith({ where: { id: sessionId } });
      expect(mockAnswerRepository.create).toHaveBeenCalledWith({
        session_id: sessionId,
        question_id: questionId,
        score,
      });
      expect(mockAnswerRepository.save).toHaveBeenCalledWith(mockAnswer);
    });

    it('should update an existing answer', async () => {
      const mockSession = {
        id: sessionId,
        user_telegram_id: 12345,
        survey_id: 1,
        status: SessionStatus.IN_PROGRESS,
      };
      const mockExistingAnswer = {
        session_id: sessionId,
        question_id: questionId,
        score: 5,
        created_at: new Date(),
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession);
      mockAnswerRepository.findOne.mockResolvedValue(mockExistingAnswer);
      mockAnswerRepository.save.mockResolvedValue({ ...mockExistingAnswer, score });

      await service.saveAnswer(sessionId, questionId, score);

      expect(mockExistingAnswer.score).toBe(score);
      expect(mockAnswerRepository.save).toHaveBeenCalledWith(mockExistingAnswer);
    });

    it('should throw BadRequestException for invalid score', async () => {
      await expect(service.saveAnswer(sessionId, questionId, 0)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.saveAnswer(sessionId, questionId, 11)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.saveAnswer(sessionId, questionId, 5.5)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when session does not exist', async () => {
      mockSessionRepository.findOne.mockResolvedValue(null);

      await expect(service.saveAnswer(sessionId, questionId, score)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSurveyStructure', () => {
    it('should return survey structure for EXPRESS type', async () => {
      const result = await service.getSurveyStructure('EXPRESS');

      expect(result).toBeDefined();
      expect(result.type).toBe('EXPRESS');
      expect(result.structure).toBeDefined();
      expect(Array.isArray(result.structure)).toBe(true);
    });

    it('should return survey structure for FULL type', async () => {
      const result = await service.getSurveyStructure('FULL');

      expect(result).toBeDefined();
      expect(result.type).toBe('FULL');
      expect(result.structure).toBeDefined();
      expect(Array.isArray(result.structure)).toBe(true);
    });

    it('should throw NotFoundException for invalid survey type', async () => {
      await expect(service.getSurveyStructure('INVALID')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSession', () => {
    const sessionId = 'session-uuid';
    const mockSession = {
      id: sessionId,
      user_telegram_id: 12345,
      survey: {
        type: SurveyType.EXPRESS,
      },
      status: SessionStatus.IN_PROGRESS,
      created_at: new Date(),
      answers: [
        { question_id: 1, score: 8 },
        { question_id: 2, score: 6 },
      ],
    };

    it('should return session with answers', async () => {
      mockSessionRepository.findOne.mockResolvedValue(mockSession);

      const result = await service.getSession(sessionId);

      expect(mockSessionRepository.findOne).toHaveBeenCalledWith({
        where: { id: sessionId },
        relations: ['answers'],
      });
      expect(result).toEqual({
        id: sessionId,
        userId: mockSession.user_telegram_id,
        surveyType: SurveyType.EXPRESS,
        status: SessionStatus.IN_PROGRESS,
        answers: { 1: 8, 2: 6 },
        createdAt: mockSession.created_at.toISOString(),
      });
    });

    it('should throw NotFoundException when session does not exist', async () => {
      mockSessionRepository.findOne.mockResolvedValue(null);

      await expect(service.getSession(sessionId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('completeSession', () => {
    const sessionId = 'session-uuid';
    const mockSession = {
      id: sessionId,
      user_telegram_id: 12345,
      survey_id: 1,
      status: SessionStatus.IN_PROGRESS,
    };

    it('should complete a session', async () => {
      mockSessionRepository.findOne.mockResolvedValue(mockSession);
      mockSessionRepository.save.mockResolvedValue({ ...mockSession, status: SessionStatus.COMPLETED });

      const result = await service.completeSession(sessionId);

      expect(mockSessionRepository.findOne).toHaveBeenCalledWith({ where: { id: sessionId } });
      expect(mockSessionRepository.save).toHaveBeenCalledWith({
        ...mockSession,
        status: SessionStatus.COMPLETED,
      });
      expect(result).toEqual({
        message: 'Session completed successfully',
        sessionId,
      });
    });

    it('should throw NotFoundException when session does not exist', async () => {
      mockSessionRepository.findOne.mockResolvedValue(null);

      await expect(service.completeSession(sessionId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('isFirstSurvey', () => {
    const userId = 12345;

    it('should return true when user has no completed surveys', async () => {
      mockSessionRepository.count.mockResolvedValue(0);

      const result = await service.isFirstSurvey(userId);

      expect(mockSessionRepository.count).toHaveBeenCalledWith({
        where: {
          user_telegram_id: userId,
          status: SessionStatus.COMPLETED,
        },
      });
      expect(result).toBe(true);
    });

    it('should return false when user has completed surveys', async () => {
      mockSessionRepository.count.mockResolvedValue(2);

      const result = await service.isFirstSurvey(userId);

      expect(result).toBe(false);
    });
  });

  describe('canStartNewSurvey', () => {
    const userId = 12345;

    it('should return true when user has no in-progress sessions', async () => {
      mockSessionRepository.count.mockResolvedValue(0);

      const result = await service.canStartNewSurvey(userId);

      expect(mockSessionRepository.count).toHaveBeenCalledWith({
        where: {
          user_telegram_id: userId,
          status: SessionStatus.IN_PROGRESS,
        },
      });
      expect(result).toBe(true);
    });

    it('should return false when user has in-progress sessions', async () => {
      mockSessionRepository.count.mockResolvedValue(1);

      const result = await service.canStartNewSurvey(userId);

      expect(result).toBe(false);
    });
  });
});
