import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreatePermissionDto {
  @IsNotEmpty({ message: 'El name no debe ir vacio' })
  @IsString({ message: 'El name debe ser un String' })
  @Length(2, 100, { message: 'El name debe tener entre 2 y 100 caracteres' })
  name: string;

  @IsOptional()
  @IsString({ message: 'El description debe ser un String' })
  @Length(2, 100, {
    message: 'El description debe tener entre 2 y 100 caracteres',
  })
  description?: string;

//   @IsUUID(4, { message: 'Debe ser un UUID válido' })
//   @IsNotEmpty({ message: 'El permiso es obligatorio' })
//   permissionId: string;
}
