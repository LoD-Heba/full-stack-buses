import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty({ message: 'El título no puede estar vacío' })
  @MaxLength(100, { message: 'El título no puede exceder los 100 caracteres' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'El contenido no puede estar vacío' })
  content: string;

  @IsUUID(4, { message: 'Debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El userId no puede estar vacío' })
  userId: string;
}
