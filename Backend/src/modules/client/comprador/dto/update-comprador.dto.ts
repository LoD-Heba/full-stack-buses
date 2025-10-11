import { PartialType } from '@nestjs/mapped-types';
import { CreateCompradorDto } from './create-comprador.dto';

export class UpdateCompradorDto extends PartialType(CreateCompradorDto) {}
