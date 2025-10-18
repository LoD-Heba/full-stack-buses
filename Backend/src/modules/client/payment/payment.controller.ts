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
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, PaymentStatus } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SearchPaymentDto } from './dto/search-payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.create(createPaymentDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.paymentService.findAll(paginationDto);
  }

  @Get('search')
  search(
    @Query() searchDto: SearchPaymentDto,
    @Query() paginationDto: PaginationDto
  ) {
    return this.paymentService.search(searchDto, paginationDto);
  }

  @Get('statistics')
  getStatistics(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string
  ) {
    const from = fromDate ? new Date(fromDate) : undefined;
    const to = toDate ? new Date(toDate) : undefined;
    return this.paymentService.getPaymentStatistics(from, to);
  }

  @Get('status/:status')
  findByStatus(
    @Param('status', new ParseEnumPipe(PaymentStatus)) status: PaymentStatus
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
    @Query('toDate') toDate: string
  ) {
    return this.paymentService.findByDateRange(
      new Date(fromDate),
      new Date(toDate)
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaymentDto: UpdatePaymentDto
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
    @Body('reason') reason?: string
  ) {
    return this.paymentService.refundPayment(id, reason);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentService.remove(id);
  }
}