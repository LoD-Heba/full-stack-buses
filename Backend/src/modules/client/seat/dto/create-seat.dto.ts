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
  IsObject,
} from 'class-validator';

import { Transform } from 'class-transformer';
import { SeatStatus } from 'src/common/enums/status.enum';

export enum SeatType {
  NORMAL = 'normal',
  SEMI_CAMA = 'semi_cama',
  CAMA = 'cama',
}

export class CreateSeatDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(10, {
    message: 'El código de asiento no puede exceder 10 caracteres',
  })
  @Transform(({ value }) => value?.trim().toUpperCase())
  seat_code: string;

  @IsOptional() // ← Hacer opcional
  @Min(1, { message: 'El número de asiento debe ser mayor que 0' })
  @Max(100, { message: 'El número de asiento no puede exceder 100' })
  seat_number?: number;

  @IsOptional()
  @IsInt({ message: 'La posición X debe ser un número entero' })
  @Min(1)
  position_x?: number;

  @IsOptional()
  @IsInt({ message: 'La posición Y debe ser un número entero' })
  @Min(1)
  position_y?: number;

  @IsOptional()
  @IsString()
  visual_type?: string; // 'seat' | 'aisle' | 'bathroom' | 'tv' | 'door'

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(360)
  rotation?: number;

  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;

  @IsOptional()
@IsEnum(SeatStatus)
status?: SeatStatus;

  @IsEnum(SeatType, {
    message: 'El tipo debe ser: normal, semi_cama o cama',
  })
  type: SeatType;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2)
  @Transform(({ value }) => parseInt(value))
  deck?: number;

  @IsNotEmpty()
  @IsUUID('4', { message: 'stackId debe ser un UUID válido' })
  stackId: string;

  @IsOptional()
  @IsBoolean({ message: 'is_active debe ser un valor booleano' })
  is_active?: boolean;
}
