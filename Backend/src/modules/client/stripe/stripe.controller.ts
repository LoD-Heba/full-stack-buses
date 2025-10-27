import {
  Controller,
  Post,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { StripeService } from './stripe.service';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  /**
   * Crear sesión de checkout
   * POST /stripe/create-checkout-session
   */
  @Post('create-checkout-session')
  createCheckoutSession(
    @Body()
    body: {
      tickets: Array<{
        tripId: string;
        seatId: string;
        price: number;
        category: string;
      }>;
      userProfileId: string;
      successUrl: string;
      cancelUrl: string;
    },
  ) {
    return this.stripeService.createCheckoutSession(body);
  }

  /**
   * Verificar pago exitoso
   * GET /stripe/verify-payment?session_id=xxx
   */
  @Get('verify-payment')
  verifyPayment(@Query('session_id') sessionId: string) {
    return this.stripeService.handleSuccessfulPayment(sessionId);
  }

  /**
   * Webhook de Stripe
   * POST /stripe/webhook
   */
  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    const rawBody = request.rawBody;
    return this.stripeService.handleWebhook(signature, rawBody);
  }

  /**
   * Crear reembolso
   * POST /stripe/refund/:paymentId
   */
  @Post('refund/:paymentId')
  createRefund(
    @Param('paymentId') paymentId: string,
    @Body('reason') reason?: string,
  ) {
    return this.stripeService.createRefund(paymentId, reason);
  }
}