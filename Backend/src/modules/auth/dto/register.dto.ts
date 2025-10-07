// register.dto.ts - Ya está en el UserService, pero aquí está para referencia
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

export class RegisterDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' })
  @Transform(({ value }) => value?.toString().trim())
  name: string;

  // Email es opcional, pero requerido si no hay phone
  @ValidateIf((o) => !o.phone)
  @IsNotEmpty({ message: 'El email es obligatorio si no proporciona teléfono' })
  @IsEmail({}, { message: 'Debe ser un correo electrónico válido' })
  @Transform(({ value }) => value?.toString().toLowerCase().trim())
  email?: string;

  // Phone es opcional, pero requerido si no hay email
  @ValidateIf((o) => !o.email)
  @IsNotEmpty({ message: 'El teléfono es obligatorio si no proporciona email' })
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @Matches(/^[+]?[0-9\s\-\(\)]{7,15}$/, { 
    message: 'El teléfono debe tener un formato válido' 
  })
  @Transform(({ value }) => value?.toString().trim())
  phone?: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @Transform(({ value }) => value?.toString().trim())
  @Length(5, 255, {
    message: 'La contraseña debe tener entre 5 y 255 caracteres',
  })
  password: string;
}