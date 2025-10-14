import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SeatService } from './seat.service';
import { CreateSeatDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('seat')
export class SeatController {
  constructor(private readonly seatService: SeatService) {}

  @Post()
  create(@Body() createSeatDto: CreateSeatDto) {
    return this.seatService.create(createSeatDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.seatService.findAll(paginationDto);
  }

 @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) { 
    return this.seatService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateSeatDto: UpdateSeatDto,
  ) {
    return this.seatService.update(id, updateSeatDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) { 
    return this.seatService.remove(id);
  }
}
