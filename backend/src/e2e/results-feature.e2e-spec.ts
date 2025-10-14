import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../app.module';
import { User, SurveySession, Report, Payment, Survey, Answer } from '../entities';
import { TelegramService } from '../telegram/telegram.service';
import { ReportService } from '../report/report.service';
import { PaymentService } from '../payment/payment.service';
import { AuthService } from '../auth/auth.service';
import { SurveyService } from '../survey/survey.service';
import { SessionStatus, PaymentStatus } from 'bizass-shared';

describe('Results Feature E2E Tests', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let sessionRepository: Repository<SurveySession>;
  let reportRepository: Repository<Report>;
  let paymentRepository: Repository<Payment>;
  let surveyRepository: Repository<Survey>;
  let answerRepository: Repository<Answer>;
  let telegramService: TelegramService;
  let reportService: ReportService;
  let paymentService: PaymentService;
  let authService: AuthService;
  let surveyService: SurveyService;

  // Test data
  const testUser = {
    id: 1,
    telegram_id: 123456789,
    telegram_username: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const testSurvey = {
    id: 'survey-1',
    type: 'express',
    name: 'Express Business Assessment',
    description: 'Quick assessment',
    structure: {
      categories: [
        {
          id: 'hr',
          name: 'HR Management',
          subcategories: [
            { id: 'recruitment', name: 'Recruitment' },
            { id: 'training', name: 'Training' }
          ],
        },
        {
          id: 'marketing',
          name: 'Marketing',
          subcategories: [
            { id: 'digital', name: 'Digital Marketing' },
            { id: 'branding', name: 'Branding' }
          ],
        },
      ],
    },
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get repositories
    userRepository = moduleFixture.get(getRepositoryToken(User));
    sessionRepository = moduleFixture.get(getRepositoryToken(SurveySession));
    reportRepository = moduleFixture.get(getRepositoryToken(Report));
    paymentRepository = moduleFixture.get(getRepositoryToken(Payment));
    surveyRepository = moduleFixture.get(getRepositoryToken(Survey));
    answerRepository = moduleFixture.get(getRepositoryToken(Answer));

    // Get services
    telegramService = moduleFixture.get(TelegramService);
    reportService = moduleFixture.get(ReportService);
    paymentService = moduleFixture.get(PaymentService);
    authService = moduleFixture.get(AuthService);
    surveyService = moduleFixture.get(SurveyService);

    // Create test data
    await userRepository.save(testUser);
    await surveyRepository.save(testSurvey);
  });

  afterAll(async () => {
    // Clean up test data
    await answerRepository.delete({});
    await reportRepository.delete({});
    await paymentRepository.delete({});
    await sessionRepository.delete({});
    await surveyRepository.delete({});
    await userRepository.delete({});
    await app.close();
  });

  describe('Full User Flow: Bot Menu to PDF Download', () => {
    it('should complete full flow from bot menu to PDF download', async () => {
      // Step 1: Create completed survey session
      const session = await sessionRepository.save({
        id: 'test-session-1',
        user_telegram_id: testUser.telegram_id,
        survey: testSurvey,
        status: SessionStatus.COMPLETED,
        started_at: new Date(),
        completed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Add some answers
      await answerRepository.save([
        { session, question_id: 1, score: 8, created_at: new Date() },
        { session, question_id: 2, score: 7, created_at: new Date() },
        { session, question_id: 3, score: 9, created_at: new Date() },
      ]);

      // Step 2: Simulate bot command /reports
      const mockUpdate = {
        update_id: 123,
        callback_query: {
          id: 'callback_123',
          from: {
            id: testUser.telegram_id,
            first_name: testUser.first_name,
            username: testUser.telegram_username,
          },
          data: 'my_results',
        },
      };

      // Mock Telegram API responses
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ result: true }),
          text: async () => 'OK',
        } as Response),
      );

      // Handle webhook
      await telegramService.handleWebhook(mockUpdate);

      // Verify bot sent list of results
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sendMessage'),
        expect.objectContaining({
          body: expect.stringContaining('express'),
        }),
      );

      // Step 3: User clicks download button
      const downloadUpdate = {
        update_id: 124,
        callback_query: {
          id: 'callback_124',
          from: {
            id: testUser.telegram_id,
            first_name: testUser.first_name,
            username: testUser.telegram_username,
          },
          data: `download_report_${session.id}`,
        },
      };

      await telegramService.handleWebhook(downloadUpdate);

      // Step 4: Verify PDF was generated (first report is free)
      const report = await reportRepository.findOne({
        where: { session_id: session.id },
      });

      expect(report).toBeDefined();
      expect(report.payment_status).toBe(PaymentStatus.FREE);

      // Step 5: Verify document was sent via Telegram
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sendDocument'),
        expect.any(Object),
      );
    });

    it('should handle multiple concurrent users', async () => {
      const users = [
        { id: 2, telegram_id: 222222222, first_name: 'User2' },
        { id: 3, telegram_id: 333333333, first_name: 'User3' },
        { id: 4, telegram_id: 444444444, first_name: 'User4' },
      ];

      // Create users and sessions
      const sessions = [];
      for (const user of users) {
        await userRepository.save({
          ...user,
          telegram_username: `user${user.id}`,
          created_at: new Date(),
          updated_at: new Date(),
        });

        const session = await sessionRepository.save({
          id: `session-user-${user.id}`,
          user_telegram_id: user.telegram_id,
          survey: testSurvey,
          status: SessionStatus.COMPLETED,
          started_at: new Date(),
          completed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        });

        sessions.push(session);
      }

      // Simulate concurrent report downloads
      const downloadPromises = sessions.map(async (session, index) => {
        const update = {
          update_id: 200 + index,
          callback_query: {
            id: `callback_${200 + index}`,
            from: {
              id: users[index].telegram_id,
              first_name: users[index].first_name,
            },
            data: `download_report_${session.id}`,
          },
        };

        return telegramService.handleWebhook(update);
      });

      // Wait for all concurrent requests
      await Promise.all(downloadPromises);

      // Verify all reports were generated
      for (const session of sessions) {
        const report = await reportRepository.findOne({
          where: { session_id: session.id },
        });
        expect(report).toBeDefined();
      }
    });

    it('should recover from errors gracefully', async () => {
      const session = await sessionRepository.save({
        id: 'test-session-error',
        user_telegram_id: testUser.telegram_id,
        survey: testSurvey,
        status: SessionStatus.COMPLETED,
        started_at: new Date(),
        completed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Mock PDF generation failure
      jest.spyOn(reportService, 'generateReport').mockRejectedValueOnce(
        new Error('PDF generation failed'),
      );

      const downloadUpdate = {
        update_id: 300,
        callback_query: {
          id: 'callback_300',
          from: {
            id: testUser.telegram_id,
            first_name: testUser.first_name,
          },
          data: `download_report_${session.id}`,
        },
      };

      await telegramService.handleWebhook(downloadUpdate);

      // Verify error message was sent to user
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sendMessage'),
        expect.objectContaining({
          body: expect.stringContaining('Ошибка'),
        }),
      );

      // Restore mock
      jest.spyOn(reportService, 'generateReport').mockRestore();
    });
  });

  describe('Payment Flow Integration', () => {
    it('should provide free report for first survey', async () => {
      const newUser = await userRepository.save({
        id: 5,
        telegram_id: 555555555,
        telegram_username: 'newuser',
        first_name: 'New',
        last_name: 'User',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const session = await sessionRepository.save({
        id: 'first-session',
        user_telegram_id: newUser.telegram_id,
        survey: testSurvey,
        status: SessionStatus.COMPLETED,
        started_at: new Date(),
        completed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Generate report
      const pdfBuffer = await reportService.generateReport(session.id, false);
      expect(pdfBuffer).toBeInstanceOf(Buffer);

      // Check if report is free
      const isFree = await reportService.isReportFree(newUser.telegram_id);
      expect(isFree).toBe(true);
    });

    it('should require payment for subsequent surveys', async () => {
      const existingUser = await userRepository.save({
        id: 6,
        telegram_id: 666666666,
        telegram_username: 'existinguser',
        first_name: 'Existing',
        last_name: 'User',
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Create first completed session (free)
      await sessionRepository.save({
        id: 'first-free-session',
        user_telegram_id: existingUser.telegram_id,
        survey: testSurvey,
        status: SessionStatus.COMPLETED,
        started_at: new Date(),
        completed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Create second session (should require payment)
      const secondSession = await sessionRepository.save({
        id: 'second-paid-session',
        user_telegram_id: existingUser.telegram_id,
        survey: testSurvey,
        status: SessionStatus.COMPLETED,
        started_at: new Date(),
        completed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Check if report requires payment
      const isFree = await reportService.isReportFree(existingUser.telegram_id);
      expect(isFree).toBe(false);

      // Simulate payment initiation
      const mockPaymentUpdate = {
        update_id: 400,
        callback_query: {
          id: 'callback_400',
          from: {
            id: existingUser.telegram_id,
            first_name: existingUser.first_name,
          },
          data: `download_report_${secondSession.id}`,
        },
      };

      await telegramService.handleWebhook(mockPaymentUpdate);

      // Verify payment message was sent
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sendInvoice'),
        expect.any(Object),
      );
    });

    it('should unlock report after payment completion', async () => {
      const paidUser = await userRepository.save({
        id: 7,
        telegram_id: 777777777,
        telegram_username: 'paiduser',
        first_name: 'Paid',
        last_name: 'User',
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Create two sessions (first free, second paid)
      await sessionRepository.save({
        id: 'paid-user-session-1',
        user_telegram_id: paidUser.telegram_id,
        survey: testSurvey,
        status: SessionStatus.COMPLETED,
        started_at: new Date(),
        completed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      const paidSession = await sessionRepository.save({
        id: 'paid-user-session-2',
        user_telegram_id: paidUser.telegram_id,
        survey: testSurvey,
        status: SessionStatus.COMPLETED,
        started_at: new Date(),
        completed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Create payment record
      await paymentRepository.save({
        id: 'payment-1',
        telegram_payment_charge_id: 'charge_123',
        telegram_id: paidUser.telegram_id,
        session_id: paidSession.id,
        amount: 1000,
        currency: 'RUB',
        status: 'SUCCESS',
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Create paid report
      await reportRepository.save({
        id: 'paid-report-1',
        session_id: paidSession.id,
        user_telegram_id: paidUser.telegram_id,
        analytics_data: {},
        payment_status: PaymentStatus.PAID,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Check if user has paid for session
      const hasPaid = await reportService.hasUserPaidForSession(paidSession.id);
      expect(hasPaid).toBe(true);

      // Generate paid report
      const pdfBuffer = await reportService.generateReport(paidSession.id, true);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });

    it('should handle payment failures gracefully', async () => {
      // Simulate payment failure
      jest.spyOn(paymentService, 'createPayment').mockRejectedValueOnce(
        new Error('Payment processing failed'),
      );

      const failedPaymentUpdate = {
        update_id: 500,
        pre_checkout_query: {
          id: 'pre_checkout_500',
          from: {
            id: testUser.telegram_id,
            first_name: testUser.first_name,
          },
          currency: 'RUB',
          total_amount: 1000,
          invoice_payload: JSON.stringify({ sessionId: 'test-session-1' }),
        },
      };

      await telegramService.handleWebhook(failedPaymentUpdate);

      // Verify error was handled
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('answerPreCheckoutQuery'),
        expect.objectContaining({
          body: expect.stringContaining('error_message'),
        }),
      );

      // Restore mock
      jest.spyOn(paymentService, 'createPayment').mockRestore();
    });
  });
});