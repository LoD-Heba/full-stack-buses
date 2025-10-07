// search-routes.dto.ts
import { IsOptional, IsUUID, IsString } from 'class-validator';

export class SearchRoutesDto {
  @IsOptional()
  @IsUUID('4')
  originCityId?: string;

  @IsOptional()
  @IsUUID('4')
  destinationCityId?: string;

  @IsOptional()
  @IsString()
  searchTerm?: string; // Buscar en nombre o descripción
}