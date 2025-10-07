import { 
  IsNotEmpty, 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsUUID,
  IsPositive,
  MaxLength,
  Matches,
  IsArray
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRouteDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'approx_duration debe tener formato HH:MM:SS (ej: 04:30:00)'
  })
  approx_duration?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  distance_km?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  base_price?: number;

  @IsNotEmpty()
  @IsUUID('4')
  originCityId: string;

  @IsNotEmpty()
  @IsUUID('4')
  destinationCityId: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  busIds?: string[];
}