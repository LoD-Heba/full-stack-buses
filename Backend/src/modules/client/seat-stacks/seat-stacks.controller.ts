import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { SeatStacksService } from './seat-stacks.service';
import { CreateSeatStackDto } from './dto/create-seat-stack.dto';
import { UpdateSeatStackDto } from './dto/update-seat-stack.dto';


@Controller('seat-stacks')
export class SeatStacksController {
  constructor(private readonly seatStacksService: SeatStacksService) {}

  @Post()
  create(@Body() createSeatStackDto: CreateSeatStackDto) {
    return this.seatStacksService.create(createSeatStackDto);
  }

  @Get()
  findAll() {
    return this.seatStacksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.seatStacksService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateSeatStackDto: UpdateSeatStackDto) {
    return this.seatStacksService.update(id, updateSeatStackDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.seatStacksService.remove(id);
  }
}
