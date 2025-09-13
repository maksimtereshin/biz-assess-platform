import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment, SurveySession, Report } from '../entities';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly botToken: string;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(SurveySession)
    private sessionRepository: Repository<SurveySession>,
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    private configService: ConfigService,
  ) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
  }

  async createPayment(userId: number, sessionId: string): Promise<any> {
    try {
      // Verify session exists and belongs to user
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId, user_telegram_id: userId },
        relations: ['survey'],
      });

      if (!session) {
        throw new NotFoundException('Session not found');
      }

      // Check if user already has a paid report for this session
      const existingPaidReport = await this.reportRepository.findOne({
        where: { session_id: sessionId, payment_status: 'PAID' },
      });

      if (existingPaidReport) {
        throw new Error('User already has a paid report for this session');
      }

      // Create payment record
      const payment = this.paymentRepository.create({
        id: uuidv4(),
        user_telegram_id: userId,
        survey_session_id: sessionId,
        amount: 999, // $9.99 in cents
        currency: 'USD',
        status: 'PENDING',
      });

      const savedPayment = await this.paymentRepository.save(payment);

      // Create Telegram invoice
      const invoice = {
        title: 'Business Assessment - Full Report',
        description: `Comprehensive business analysis report for your ${session.survey?.type || 'survey'} assessment`,
        payload: `payment_${savedPayment.id}`,
        provider_token: this.configService.get<string>('TELEGRAM_PAYMENT_PROVIDER_TOKEN'),
        currency: 'USD',
        prices: [
          {
            label: 'Full Report',
            amount: 999, // $9.99 in cents
          },
        ],
        max_tip_amount: 0,
        suggested_tip_amounts: [],
        start_parameter: `payment_${savedPayment.id}`,
        provider_data: JSON.stringify({
          receipt: {
            items: [
              {
                description: 'Business Assessment Full Report',
                quantity: '1',
                amount: {
                  value: '9.99',
                  currency: 'USD',
                },
              },
            ],
          },
        }),
        photo_url: 'https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=Business+Assessment',
        photo_size: 400,
        photo_width: 400,
        photo_height: 400,
        need_name: false,
        need_phone_number: false,
        need_email: false,
        need_shipping_address: false,
        send_phone_number_to_provider: false,
        send_email_to_provider: false,
        is_flexible: false,
      };

      return {
        paymentId: savedPayment.id,
        invoice,
      };
    } catch (error) {
      this.logger.error('Error creating payment:', error);
      throw error;
    }
  }

  async verifyPayment(chargeId: string, paymentId: string): Promise<boolean> {
    try {
      // Find the payment record
      const payment = await this.paymentRepository.findOne({
        where: { id: paymentId },
        relations: ['survey_session'],
      });

      if (!payment) {
        this.logger.error(`Payment not found: ${paymentId}`);
        return false;
      }

      // Verify payment with Telegram API
      const isValidPayment = await this.verifyPaymentWithTelegram(chargeId, payment);

      if (!isValidPayment) {
        this.logger.error(`Payment verification failed with Telegram API: ${chargeId}`);
        payment.status = 'FAILED';
        await this.paymentRepository.save(payment);
        return false;
      }

      // Update payment status only after successful verification
      payment.telegram_charge_id = chargeId;
      payment.status = 'SUCCESSFUL';
      await this.paymentRepository.save(payment);

      // Generate paid report
      await this.generatePaidReport(payment.survey_session_id);

      this.logger.log(`Payment verified successfully: ${paymentId}`);
      return true;
    } catch (error) {
      this.logger.error('Error verifying payment:', error);
      return false;
    }
  }

  private async verifyPaymentWithTelegram(chargeId: string, payment: Payment): Promise<boolean> {
    try {
      // Call Telegram API to verify the payment
      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/getUpdates`,
        {
          offset: -1,
          limit: 100,
          allowed_updates: ['successful_payment'],
        }
      );

      if (!response.data.ok) {
        this.logger.error('Failed to fetch updates from Telegram API');
        return false;
      }

      // Look for successful payment with matching charge ID
      const updates = response.data.result;
      const paymentUpdate = updates.find((update: any) =>
        update.message?.successful_payment?.telegram_payment_charge_id === chargeId &&
        update.message?.successful_payment?.invoice_payload === `payment_${payment.id}`
      );

      if (!paymentUpdate) {
        this.logger.error(`No matching payment found in Telegram updates for charge: ${chargeId}`);
        return false;
      }

      const successfulPayment = paymentUpdate.message.successful_payment;

      // Verify payment details match our records
      if (
        successfulPayment.currency !== payment.currency ||
        successfulPayment.total_amount !== payment.amount
      ) {
        this.logger.error('Payment details mismatch with Telegram data');
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Error verifying payment with Telegram API:', error);
      return false;
    }
  }

  private async generatePaidReport(sessionId: string): Promise<void> {
    try {
      // This would integrate with the ReportService to generate a paid report
      // For now, we'll create a mock report
      const report = this.reportRepository.create({
        id: uuidv4(),
        session_id: sessionId,
        payment_status: 'PAID',
        storage_url: `/uploads/paid_report_${sessionId}.pdf`,
        analytics_summary: {},
      });

      await this.reportRepository.save(report);
      this.logger.log(`Paid report generated for session: ${sessionId}`);
    } catch (error) {
      this.logger.error('Error generating paid report:', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<string> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    return payment?.status || 'NOT_FOUND';
  }
}
