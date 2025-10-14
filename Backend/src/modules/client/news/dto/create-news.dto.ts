import { IsNotEmpty, IsString, IsUUID, IsOptional } from "class-validator"

export class CreateNewsDto {
    
    @IsString({ message: 'El título debe ser String'})
    @IsNotEmpty({ message: 'El titulo no puede ser vacio'})
    title: string

    @IsString({ message:'El contenido debe ser string'})
    @IsNotEmpty({ message:'El contenido no puede ser vacio'})
    content: string

    @IsNotEmpty({message: 'La id es obligatorio'})
    @IsUUID(4, { message: 'La id del usuario no existe o está inactivo' })
    userIds: string

    @IsOptional()
    @IsString()
    image_url?: string
}