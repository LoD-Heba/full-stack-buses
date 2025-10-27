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
  BadRequestException,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request } from 'express';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

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

  @Get('verify-payment')
  verifyPayment(@Query('session_id') sessionId: string) {
    return this.stripeService.handleSuccessfulPayment(sessionId);
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    // ✅ FIX: Validar que rawBody existe
    const rawBody = request.rawBody;
    
    if (!rawBody) {
      throw new BadRequestException('Raw body no disponible');
    }

    return this.stripeService.handleWebhook(signature, rawBody);
  }

  @Post('refund/:paymentId')
  createRefund(
    @Param('paymentId') paymentId: string,
    @Body('reason') reason?: string,
  ) {
    return this.stripeService.createRefund(paymentId, reason);
  }
}