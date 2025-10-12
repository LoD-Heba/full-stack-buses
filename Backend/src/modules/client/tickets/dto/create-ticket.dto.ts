import { 
  IsNotEmpty, 
  IsNumber, 
  IsOptional, 
  IsEnum,
  IsUUID,
  IsPositive
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

  @IsNotEmpty()
  @IsUUID('4')
  userId: string; // Solo usuarios registrados

  @IsOptional()
  @IsUUID('4')
  paymentId?: string;
}