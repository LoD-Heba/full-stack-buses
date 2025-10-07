import { PartialType } from '@nestjs/mapped-types';
import { CreateTripDto, TripStatus } from './create-trip.dto';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateTripDto extends PartialType(CreateTripDto) {
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;
}
