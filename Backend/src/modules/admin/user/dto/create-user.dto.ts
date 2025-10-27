// create-user.dto.ts
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  isURL,
  IsUUID,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' })
  @Transform(({ value }) => value?.toString().trim())
  name: string;

   @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'La imagen debe ser una URL válida' })
  image_url?: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @Transform(({ value }) => value?.toString().trim())
  @Length(5, 255, {
    message: 'La contraseña debe tener entre 5 y 255 caracteres',
  })
  password: string;

  @IsUUID(4, { message: 'Debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El rol es obligatorio' })
  roleId: string;

  @IsOptional()
  @IsUUID(4, { message: 'Debe ser un UUID válido' })
  profileId?: string;
}
