import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateCityDto {
  @IsString({ message: 'El nombre de la ciudad debe ser texto válido.' })
  @IsNotEmpty({ message: 'El nombre de la ciudad es requerido.' })
  @MaxLength(100, { message: 'El nombre no debe superar los 100 caracteres.' })
  city: string;

  @IsString({ message: 'El departamento debe ser texto válido.' })
  @IsNotEmpty({ message: 'El departamento es requerido.' })
  @MaxLength(100, { message: 'El departamento no debe superar los 100 caracteres.' })
  department: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto.' })
  @MaxLength(500, { message: 'La descripción no debe superar los 500 caracteres.' })
  description?: string;
}
