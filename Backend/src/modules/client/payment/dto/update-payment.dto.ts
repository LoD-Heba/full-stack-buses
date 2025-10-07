import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentDto, PaymentStatus } from './create-payment.dto';
import { IsOptional, IsEnum } from 'class-validator';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}