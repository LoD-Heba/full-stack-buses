import { IsOptional, IsEnum, IsDateString, IsNumber, Min } from 'class-validator';
import { PaymentMethod, PaymentStatus, PaymentCategory } from './create-payment.dto';
import { Transform } from 'class-transformer';

export class SearchPaymentDto {
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentCategory)
  category?: PaymentCategory;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  maxAmount?: number;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  searchTerm?: string; // Buscar en transaction_reference o notes
}