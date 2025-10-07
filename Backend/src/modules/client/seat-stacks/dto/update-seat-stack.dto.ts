import { PartialType } from '@nestjs/mapped-types';
import { CreateSeatStackDto } from './create-seat-stack.dto';

export class UpdateSeatStackDto extends PartialType(CreateSeatStackDto) {}
