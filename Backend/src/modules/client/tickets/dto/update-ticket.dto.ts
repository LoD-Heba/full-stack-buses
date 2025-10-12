import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketDto} from './create-ticket.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { TicketStatus } from 'src/common/enums/status.enum';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;
}