import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsPositive,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum PaymentCategory {
  CHILD = 'niño',
  ADULT = 'adulto',
  SENIOR = 'adulto_mayor',
  STUDENT = 'estudiante'
}

export enum PaymentMethod {
  CASH = 'EFECTIVO',
  CARD = 'TARJETA',
  QR = 'QR',
  TRANSFER = 'TRANSFERENCIA'
}

export enum PaymentStatus {
  PENDING = 'PENDIENTE',
  COMPLETED = 'COMPLETO',
  FAILED = 'FALLIDO',
  REFUNDED = 'REEMBOLZO'
}

export class CreatePaymentDto {
  @IsEnum(PaymentCategory, {
    message: 'La categoría debe ser: niño, adulto, adulto_mayor o estudiante'
  })
  @IsOptional()
  category?: PaymentCategory;

  @IsNotEmpty({ message: 'El monto es obligatorio' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El monto debe ser un número con máximo 2 decimales' })
  @IsPositive({ message: 'El monto debe ser mayor que 0' })
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @IsEnum(PaymentMethod, {
    message: 'El método de pago debe ser: CASH, CARD, QR o TRANSFER'
  })
  method: PaymentMethod;

  @IsEnum(PaymentStatus, {
    message: 'El estado debe ser: PENDING, COMPLETED, FAILED o REFUNDED'
  })
  @IsOptional()
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'La referencia de transacción no puede exceder 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  transaction_reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Las notas no pueden exceder 500 caracteres' })
  @Transform(({ value }) => value?.trim())
  notes?: string;
}