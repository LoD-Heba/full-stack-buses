import { IsOptional, IsUUID, IsString, IsEnum } from 'class-validator';
import { ServiceType, BusStatus } from './create-bus.dto';

export class SearchBusDto {
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @IsOptional()
  @IsEnum(ServiceType)
  service_type?: ServiceType;

  @IsOptional()
  @IsEnum(BusStatus)
  status?: BusStatus;

  @IsOptional()
  @IsString()
  searchTerm?: string; // Buscar en placa, modelo o amenidades
}