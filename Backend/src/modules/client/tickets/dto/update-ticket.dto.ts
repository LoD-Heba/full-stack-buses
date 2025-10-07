import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketDto, TicketStatus } from './create-ticket.dto';
import { IsOptional, IsEnum } from 'class-validator';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;
}