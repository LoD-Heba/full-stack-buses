
// create-trip.dto.ts
import { 
  IsNotEmpty, 
  IsNumber, 
  IsDateString, 
  IsOptional, 
  IsEnum,
  IsUUID,
  IsPositive,
  ValidateIf
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TripStatus } from 'src/common/enums/status.enum';

export class CreateTripDto {
  @IsNotEmpty()
  @IsDateString({}, { message: 'departure_time debe ser una fecha válida' })
  departure_time: string;

  @IsNotEmpty()
  @IsDateString({}, { message: 'arrival_time debe ser una fecha válida' })
  arrival_time: string;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  price: number;

  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;

  @IsNotEmpty()
  @IsUUID('4')
  busId: string;

  @IsNotEmpty()
  @IsUUID('4')
  routeId: string;

  // Validación personalizada: arrival_time debe ser después de departure_time
  @ValidateIf((o) => o.departure_time && o.arrival_time)
  @Transform(({ obj }) => {
    if (new Date(obj.arrival_time) <= new Date(obj.departure_time)) {
      throw new Error('arrival_time debe ser posterior a departure_time');
    }
    return obj.arrival_time;
  })
  private _validateTimes?: string;
}