import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

export class CreateRoleDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del rol es obligatorio' })
  @Length(3, 50, {
    message: 'El nombre debe tener entre 3 y 50 caracteres',
  })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'El nombre solo puede contener letras, números, guiones y guiones bajos',
  })
  @Transform(({ value }) => value?.toString().toLowerCase().trim())
  name: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @Length(0, 1000, {
    message: 'La descripción no puede exceder los 1000 caracteres',
  })
  @Transform(({ value }) => value?.toString().trim() || null)
  description?: string;

  // @IsNotEmpty({ message: 'El permiso es obligatorio' })
  // permissionIds: string[];
}
