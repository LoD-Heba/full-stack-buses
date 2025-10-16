import { 
  IsNotEmpty, 
  IsNumber, 
  IsOptional, 
  IsEnum,
  IsUUID,
  IsPositive,
  ValidateIf
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TicketStatus } from 'src/common/enums/status.enum';

export class CreateTicketDto {
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  price: number;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsNotEmpty()
  @IsUUID('4')
  tripId: string;

  @IsNotEmpty()
  @IsUUID('4')
  seatId: string;

  // ✅ Cambiar: userId es OPCIONAL (usuario registrado)
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  // ✅ AGREGAR: userProfileId es REQUERIDO (cliente/invitado)
  @IsNotEmpty()
  @IsUUID('4')
  userProfileId: string;

  @IsOptional()
  @IsUUID('4')
  paymentId?: string;
}