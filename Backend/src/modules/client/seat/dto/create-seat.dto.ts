import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum SeatType {
  NORMAL = 'normal',
  SEMI_CAMA = 'semi_cama',
  CAMA = 'cama'
}

export class CreateSeatDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(10, { message: 'El código de asiento no puede exceder 10 caracteres' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  seat_code: string;

  @IsInt({ message: 'El número de asiento debe ser un número entero' })
  @Min(1, { message: 'El número de asiento debe ser mayor que 0' })
  @Max(100, { message: 'El número de asiento no puede exceder 100' })
  seat_number: number;

  @IsOptional()
  @IsInt({ message: 'El deck debe ser un número entero' })
  @Min(1, { message: 'El deck debe ser al menos 1' })
  @Max(2, { message: 'El deck no puede exceder 2' })
  deck?: number;

  @IsEnum(SeatType, { 
    message: 'El tipo debe ser: normal, semi_cama o cama' 
  })
  type: SeatType;

  @IsNotEmpty()
  @IsUUID('4', { message: 'stackId debe ser un UUID válido' })
  stackId: string;

  @IsOptional()
  @IsBoolean({ message: 'is_active debe ser un valor booleano' })
  is_active?: boolean;
}
