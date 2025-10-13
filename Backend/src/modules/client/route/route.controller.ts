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
  ParseIntPipe,
} from '@nestjs/common';
import { RouteService } from './route.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { SearchRoutesDto } from './dto/search-routes.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('routes') // Cambié a 'routes' para seguir convención REST
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Post()
  create(@Body() createRouteDto: CreateRouteDto) {
    return this.routeService.create(createRouteDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.routeService.findAll(paginationDto);
  }

  @Get('search')
  search(
    @Query() searchDto: SearchRoutesDto,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.routeService.search(searchDto, paginationDto);
  }

  @Get('popular')
  findPopular(@Query('limit', ParseIntPipe) limit?: number) {
    return this.routeService.findPopularRoutes(limit);
  }

  @Get('city/:cityId')
  findByCity(
    @Param('cityId', ParseUUIDPipe) cityId: string,
    @Query('type') type?: 'origin' | 'destination' | 'both',
  ) {
    return this.routeService.findByCity(cityId, type);
  }
  @Get(':id/buses')
  getBusesForRoute(@Param('id', ParseUUIDPipe) id: string) {
    return this.routeService.getBusesForRoute(id);
  }
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.routeService.findOne(id);
  }

  @Get(':id/statistics')
  getStatistics(@Param('id', ParseUUIDPipe) id: string) {
    return this.routeService.getRouteStatistics(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRouteDto: UpdateRouteDto,
  ) {
    return this.routeService.update(id, updateRouteDto);
  }

  @Post(':routeId/buses/:busId')
  assignBus(
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @Param('busId', ParseUUIDPipe) busId: string,
  ) {
    return this.routeService.assignBus(routeId, busId);
  }

  @Delete(':routeId/buses/:busId')
  removeBus(
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @Param('busId', ParseUUIDPipe) busId: string,
  ) {
    return this.routeService.removeBus(routeId, busId);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.routeService.remove(id);
  }
}
