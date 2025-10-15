import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
  Max,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SeatType } from './create-seat.dto';

class BulkSeatItem {
  @IsNotEmpty()
  seat_code: string;

  @IsInt()
  @Min(1)
  @Max(100)
  seat_number: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  position_x?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  position_y?: number;

  @IsOptional()
  visual_type?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(360)
  rotation?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2)
  deck?: number;

  @IsEnum(SeatType)
  type: SeatType;

  @IsOptional()
  meta?: Record<string, any>;
}

export class CreateBulkSeatsDto {
  @IsNotEmpty()
  @IsUUID('4')
  stackId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkSeatItem)
  seats: BulkSeatItem[];
}