import { PartialType } from '@nestjs/mapped-types';
import { CreateTripDto} from './create-trip.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { TripStatus } from 'src/common/enums/status.enum';

export class UpdateTripDto extends PartialType(CreateTripDto) {
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;
}
