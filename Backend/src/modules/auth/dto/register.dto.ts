// Backend/src/modules/auth/dto/register.dto.ts
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

// DTO para los datos del perfil (opcional)
export class ProfileDataDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @Length(2, 100, {
    message: 'El nombre debe tener entre 2 y 100 caracteres',
  })
  @Transform(({ value }) => value?.toString().trim())
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Los apellidos deben ser una cadena de texto' })
  @Length(2, 100, {
    message: 'Los apellidos deben tener entre 2 y 100 caracteres',
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

  @IsOptional()
  @IsEmail({}, { message: 'Debe ser un correo electrónico válido' })
  @Transform(({ value }) => value?.toString().toLowerCase().trim())
  email?: string;
}

export class RegisterDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' })
  @Transform(({ value }) => value?.toString().trim())
  name: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @Transform(({ value }) => value?.toString().trim())
  @Length(4, 255, {
    message: 'La contraseña debe tener entre 4 y 255 caracteres',
  })
  password: string;

  // AHORA profile es OBLIGATORIO (debe contener email o phone)
  @IsNotEmpty({ message: 'Los datos del perfil son obligatorios' })
  @ValidateNested()
  @Type(() => ProfileDataDto)
  profile: ProfileDataDto;
}
