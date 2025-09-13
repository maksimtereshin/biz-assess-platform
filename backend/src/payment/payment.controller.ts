import { Controller, Post, Body, Param, UseGuards } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("payment")
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post("create-invoice/:sessionId")
  @UseGuards(JwtAuthGuard)
  async createInvoice(
    @Param("sessionId") sessionId: string,
    @Body() body: { userId: number },
  ) {
    return this.paymentService.createPayment(body.userId, sessionId);
  }

  @Post("webhook")
  async handlePaymentWebhook(@Body() payload: any) {
    // Handle different types of payment webhooks
    if (payload.pre_checkout_query) {
      // Handle pre-checkout query
      return this.handlePreCheckoutQuery(payload.pre_checkout_query);
    } else if (payload.successful_payment) {
      // Handle successful payment
      return this.handleSuccessfulPayment(payload.successful_payment);
    }

    return { ok: true };
  }

  private async handlePreCheckoutQuery(query: any): Promise<any> {
    // Extract payment ID from payload
    const paymentId = query.invoice_payload.replace("payment_", "");

    // Verify payment exists and is pending
    const status = await this.paymentService.getPaymentStatus(paymentId);

    if (status === "PENDING") {
      return {
        ok: true,
        pre_checkout_query_id: query.id,
      };
    } else {
      return {
        ok: false,
        pre_checkout_query_id: query.id,
        error_message: "Payment not found or already processed",
      };
    }
  }

  private async handleSuccessfulPayment(payment: any): Promise<any> {
    // Extract payment ID from payload
    const paymentId = payment.invoice_payload.replace("payment_", "");

    // Verify payment
    const success = await this.paymentService.verifyPayment(
      payment.telegram_payment_charge_id,
      paymentId,
    );

    return {
      ok: success,
      message: success
        ? "Payment processed successfully"
        : "Payment verification failed",
    };
  }
}
