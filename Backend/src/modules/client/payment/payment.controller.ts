import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  ParseEnumPipe,
  Req,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, PaymentStatus } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SearchPaymentDto } from './dto/search-payment.dto';
import { StripeService } from '../stripe/stripe.service';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly stripeService: StripeService,
  ) {}

  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.create(createPaymentDto);
  }

  @Post('webhook')
  async handleStripeWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.body;

    try {
      const event = this.stripeService.constructWebhookEvent(
        RawBody,
        signature,
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          // Actualizar pago en BD si es necesario
          break;

        case 'payment_intent.payment_failed':
          // Manejar fallo de pago
          break;

        case 'charge.refunded':
          // Manejar reembolso
          break;
      }

      return { received: true };
    } catch (error) {
      throw new BadRequestException('Webhook signature verification failed');
    }
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.paymentService.findAll(paginationDto);
  }

  @Get('search')
  search(
    @Query() searchDto: SearchPaymentDto,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.paymentService.search(searchDto, paginationDto);
  }

  @Get('statistics')
  getStatistics(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const from = fromDate ? new Date(fromDate) : undefined;
    const to = toDate ? new Date(toDate) : undefined;
    return this.paymentService.getPaymentStatistics(from, to);
  }

  @Get('status/:status')
  findByStatus(
    @Param('status', new ParseEnumPipe(PaymentStatus)) status: PaymentStatus,
  ) {
    return this.paymentService.findByStatus(status);
  }

  @Get('method/:method')
  findByMethod(@Param('method') method: string) {
    return this.paymentService.findByMethod(method);
  }

  @Get('date-range')
  findByDateRange(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.paymentService.findByDateRange(
      new Date(fromDate),
      new Date(toDate),
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return this.paymentService.update(id, updatePaymentDto);
  }

  @Patch(':id/process')
  processPayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentService.processPayment(id);
  }

  @Patch(':id/refund')
  refundPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    return this.paymentService.refundPayment(id, reason);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentService.remove(id);
  }
}
