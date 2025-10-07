import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  ParseEnumPipe,
} from '@nestjs/common';
import { BusService } from './bus.service';
import { CreateBusDto, BusStatus } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { SearchBusDto } from './dto/search-bus.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('buses')
export class BusController {
  constructor(private readonly busService: BusService) {}

  @Post()
  create(@Body() createBusDto: CreateBusDto) {
    return this.busService.create(createBusDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.busService.findAll(paginationDto);
  }

  @Get('search')
  search(
    @Query() searchDto: SearchBusDto,
    @Query() paginationDto: PaginationDto
  ) {
    return this.busService.search(searchDto, paginationDto);
  }

  @Get('available')
  findAvailable() {
    return this.busService.findAvailable();
  }

  @Get('user/:userId')
  findByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.busService.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.busService.findOne(id);
  }

  @Get(':id/statistics')
  getStatistics(@Param('id', ParseUUIDPipe) id: string) {
    return this.busService.getBusStatistics(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBusDto: UpdateBusDto
  ) {
    return this.busService.update(id, updateBusDto);
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status', new ParseEnumPipe(BusStatus)) status: BusStatus
  ) {
    return this.busService.changeStatus(id, status);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.busService.remove(id);
  }
}