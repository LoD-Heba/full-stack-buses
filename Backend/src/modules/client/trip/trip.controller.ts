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
} from '@nestjs/common';
import { TripService } from './trip.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { SearchTripsDto } from './dto/search-trip.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('trips')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Post()
  create(@Body() createTripDto: CreateTripDto) {
    return this.tripService.create(createTripDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.tripService.findAll(paginationDto);
  }

  @Get('search')
  search(
    @Query() searchDto: SearchTripsDto,
    @Query() paginationDto: PaginationDto
  ) {
    return this.tripService.search(searchDto, paginationDto);
  }

  @Get('available')
  findAvailable(
    @Query('routeId') routeId?: string,
    @Query('date') date?: string
  ) {
    return this.tripService.findAvailableTrips(routeId, date);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tripService.findOne(id);
  }

  @Get(':id/statistics')
  getStatistics(@Param('id', ParseUUIDPipe) id: string) {
    return this.tripService.getTripStatistics(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTripDto: UpdateTripDto
  ) {
    return this.tripService.update(id, updateTripDto);
  }

  @Patch(':id/start')
  start(@Param('id', ParseUUIDPipe) id: string) {
    return this.tripService.startTrip(id);
  }

  @Patch(':id/complete')
  complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.tripService.completeTrip(id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.tripService.cancelTrip(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tripService.remove(id);
  }

  @Delete(':id/permanent')
permanentRemove(@Param('id', ParseUUIDPipe) id: string) {
  return this.tripService.permanentRemove(id);
}

}