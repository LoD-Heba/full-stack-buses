import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateSeatStackDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  @Matches(/\S/, {
    message: 'Las comodidades no pueden contener solo espacios',
  })
  name: string;

  @IsNotEmpty({ message: 'El número de piso es requerido' })
  @IsInt({ message: 'El número de piso debe ser un entero' })
  @Min(1, { message: 'El piso debe ser al menos 1' })
  @Max(2, { message: 'El piso no puede ser mayor a 2' })
  floor_number: number;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  @Matches(/\S/, {
    message: 'Las comodidades no pueden contener solo espacios',
  })
  description?: string;

  @IsNotEmpty({ message: 'El busId es requerido' })
  @IsUUID(4, { message: 'busId debe ser un UUID válido' })
  busId: string;
}
