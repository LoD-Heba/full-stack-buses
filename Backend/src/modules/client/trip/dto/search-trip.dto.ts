import { IsOptional, IsDateString, IsUUID, IsEnum } from 'class-validator';
import { TripStatus } from './create-trip.dto';

export class SearchTripsDto {
  @IsOptional()
  @IsUUID('4')
  routeId?: string;

  @IsOptional()
  @IsUUID('4')
  busId?: string;

  @IsOptional()
  @IsDateString()
  departureDate?: string; // Buscar por fecha específica

  @IsOptional()
  @IsDateString()
  fromDate?: string; // Buscar desde esta fecha

  @IsOptional()
  @IsDateString()
  toDate?: string; // Buscar hasta esta fecha

  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;
}