import { PartialType } from '@nestjs/mapped-types';
import { BusStatus, CreateBusDto } from './create-bus.dto';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateBusDto extends PartialType(CreateBusDto) {
  @IsOptional()
  @IsEnum(BusStatus)
  status?: BusStatus;
}
