import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationDto {
    
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El valor de la página debe ser un número entero' })
  @Min(1, { message: 'El valor de la página debe ser mayor o igual a 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El valor del límite debe ser un número entero' })
  @Min(1, { message: 'El valor del límite debe ser mayor o igual a 1' })
  @Max(100, { message: 'El valor del límite debe ser menor o igual a 100' })
  limit?: number;
}
