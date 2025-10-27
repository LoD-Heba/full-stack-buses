// login.dto.ts
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';

export class LoginDto {
  // Acepta email o teléfono del PERFIL como identificador
  @IsNotEmpty({ message: 'El identificador (email o teléfono) es obligatorio' })
  @IsString({ message: 'El identificador debe ser una cadena de texto' })
  @Transform(({ value }) => value?.toString().trim())
  identifier: string; // Email o teléfono del perfil

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @Length(1, 255, {
    message: 'La contraseña debe tener entre 1 y 255 caracteres',
  })
  password: string;
}