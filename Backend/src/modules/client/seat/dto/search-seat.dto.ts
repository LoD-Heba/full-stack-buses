import { IsOptional, IsUUID, IsEnum, IsInt, Min, Max } from 'class-validator';
import { SeatType } from './create-seat.dto';
import { Transform } from 'class-transformer';

export class SearchSeatDto {
  @IsOptional()
  @IsUUID('4')
  stackId?: string;

  @IsOptional()
  @IsEnum(SeatType)
  type?: SeatType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2)
  @Transform(({ value }) => parseInt(value))
  deck?: number;

  @IsOptional()
  searchTerm?: string; // Buscar en seat_code
}