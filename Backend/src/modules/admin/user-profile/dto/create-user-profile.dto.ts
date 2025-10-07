import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, Length, Matches } from "class-validator";

export class CreateUserProfileDto {
     @IsString({ message: 'Los nombres deben ser una cadena de texto' })
    @IsNotEmpty({ message: 'Los nombres son obligatorios' })
    @Length(2, 100, {
      message: 'Los nombres deben tener entre 2 y 100 caracteres',
    })
    @Transform(({ value }) => value?.toString().trim())
    firstName: string;
  
    @IsOptional()
    @IsString({ message: 'Los apellidos deben ser una cadena de texto' })
    @Length(3, 100, {
      message: 'Los apellidos deben tener entre 3 y 100 caracteres',
    })
    @Transform(({ value }) => value?.toString().trim())
    lastName?: string;
    
    @IsOptional()
    @IsString({ message: 'El C.I. debe ser válido' })
    @Matches(/^\d{7,10}(-[0-9A-Za-z]{1,3})?$/, {
      message:
        'Formato de CI inválido. Ejemplos: 8502732, 1234567890 o 8502732-1B',
    })
    @Transform(({ value }) => value?.toString().toUpperCase().trim())
    documentNumber?: string;
  
    @IsOptional()
    @IsString({ message: 'El teléfono debe ser una cadena de texto' })
    @Matches(/^(\+\d{1,4})?[\s\-]?\d{6,15}$/, {
      message: 'Formato inválido. Ejemplos: +59170123456, +591 70123456',
    })
    @Transform(({ value }) =>
      value
        ?.toString()
        .replace(/[\s\-]/g, '')
        .trim(),
    )
    phone?: string;
  
    @IsOptional()
    @IsString({ message: 'La dirección debe ser una cadena de texto' })
    @Length(0, 200, {
      message: 'La dirección debe tener entre 5 y 200 caracteres',
    })
    @Transform(({ value }) => value?.toString().trim())
    address?: string;
}
