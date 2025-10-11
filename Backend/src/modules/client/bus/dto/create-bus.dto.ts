// Backend/src/modules/client/bus/dto/create-bus.dto.ts
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Length,
  Matches,
  MaxLength,
  Min,
  MinLength,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum ServiceType {
  NORMAL = 'normal',
  SEMI_CAMA = 'semi_cama',
  CAMA = 'cama'
}

export enum BusStatus {
  DISPONIBLE = 'disponible',
  EN_USO = 'en_uso',
  MANTENIMIENTO = 'mantenimiento',
  FUERA_DE_SERVICIO = 'fuera_de_servicio'
}
 
export class CreateBusDto {
  @IsString()
  @IsNotEmpty({ message: 'La placa no puede estar vacía' })
  @MinLength(3, { message: 'La placa debe tener al menos 3 caracteres' })
  @MaxLength(20, { message: 'La placa no puede exceder los 20 caracteres' })
  @Matches(/^[A-Z0-9\-]+$/, { 
    message: 'La placa solo puede contener letras mayúsculas, números y guiones' 
  })
  @Transform(({ value }) => value?.toUpperCase().trim())
  plate: string;

  @IsString()
  @IsNotEmpty({ message: 'El modelo no puede estar vacío' })
  @MinLength(2, { message: 'El modelo debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El modelo no puede exceder los 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  model: string;

  @IsOptional()
  @IsInt({ message: 'El año debe ser un número entero' })
  @Min(1950, { message: 'El año debe ser mayor que 1950' })
  @Max(new Date().getFullYear() + 2, { 
    message: `El año no puede ser mayor que ${new Date().getFullYear() + 2}` 
  })
  year?: number;

  @IsOptional()
  @IsInt({ message: 'La capacidad debe ser un número entero' })
  @Min(15, { message: 'La capacidad debe ser mayor que 15' })
  @Max(80, { message: 'La capacidad no puede ser mayor que 80' })
  capacity?: number;

  @IsEnum(ServiceType, { 
    message: 'service_type debe ser: normal, semi_cama o cama' 
  })
  service_type: ServiceType;

  @IsOptional() 
  @IsString()
  @Length(2, 500, { 
    message: 'Las amenidades deben tener entre 2 y 500 caracteres' 
  })
  @Transform(({ value }) => value?.trim())
  amenities?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'La URL de la imagen no puede exceder los 1000 caracteres' })
  image_url?: string;

  @IsOptional()
  @IsEnum(BusStatus, {
    message: 'El status debe ser: disponible, en_uso, mantenimiento o fuera_de_servicio'
  })
  status?: BusStatus;

  @IsOptional()
  @IsBoolean({ message: 'is_active debe ser un valor booleano' })
  is_active?: boolean;

  @IsNotEmpty({ message: 'El userId es requerido' })
  @IsUUID(4, { message: 'userId debe ser un UUID válido' })
  userId: string;

  @IsOptional()
  @IsUUID(4, { message: 'stackId debe ser un UUID válido' })
  stackId?: string;
}