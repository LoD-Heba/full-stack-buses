import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { SeatType } from '../../seat/dto/create-seat.dto';

class SeatConfigItem {
  @IsNotEmpty()
  @IsString()
  seat_code: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  seat_number?: number | null;

  @IsInt()
  @Min(1)
  position_x: number;

  @IsInt()
  @Min(1)
  position_y: number;

  @IsOptional()
  @IsString()
  visual_type?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(360)
  rotation?: number;

  @IsEnum(SeatType)
  type: SeatType;

  @IsOptional()
  meta?: Record<string, any>;
}

class DeckConfig {
  @IsInt()
  @Min(1)
  @Max(2)
  floor_number: number;

  @IsNotEmpty()
  @IsString()
  stack_name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeatConfigItem)
  seats: SeatConfigItem[];
}

export class ConfigureBusLayoutDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeckConfig)
  decks: DeckConfig[];
}