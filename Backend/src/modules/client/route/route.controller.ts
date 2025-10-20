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
import { RouteService } from './route.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('routes')
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Post()
  create(@Body() createRouteDto: CreateRouteDto) {
    return this.routeService.create(createRouteDto);
  }

  /**
   * GET /routes - Obtener rutas activas con paginación
   * GET /routes?inactive=true - Obtener rutas inactivas
   */
  @Get()
  findAll(
    @Query('inactive') inactive?: string,
    @Query() paginationDto: PaginationDto = {} as PaginationDto,
  ) {
    if (inactive === 'true') {
      return this.routeService.findInactive(paginationDto);
    }
    return this.routeService.findAll(paginationDto);
  }

  /**
   * GET /routes/list/inactive - Lista de rutas inactivas
   */
  @Get('list/inactive')
  findInactive() {
    return this.routeService.findInactive();
  }

  /**
   * GET /routes/city/:cityId - Obtener rutas por ciudad
   */
  @Get('city/:cityId')
  findByCity(
    @Param('cityId', ParseUUIDPipe) cityId: string,
    @Query('type') type?: 'origin' | 'destination' | 'both',
  ) {
    return this.routeService.findByCity(cityId, type);
  }

  /**
   * GET /routes/:id/buses - Obtener buses asignados a una ruta
   */
  @Get(':id/buses')
  getBusesForRoute(@Param('id', ParseUUIDPipe) id: string) {
    return this.routeService.getBusesForRoute(id);
  }

  /**
   * GET /routes/:id - Obtener una ruta específica
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.routeService.findOne(id);
  }

  /**
   * PATCH /routes/:id - Actualizar una ruta
   */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRouteDto: UpdateRouteDto,
  ) {
    return this.routeService.update(id, updateRouteDto);
  }

  /**
   * PATCH /routes/:id/reactivate - Reactivar una ruta inactiva
   */
  @Patch(':id/reactivate')
  reactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.routeService.reactivate(id);
  }

  /**
   * POST /routes/:routeId/buses/:busId - Asignar bus a ruta
   */
  @Post(':routeId/buses/:busId')
  assignBus(
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @Param('busId', ParseUUIDPipe) busId: string,
  ) {
    return this.routeService.assignBus(routeId, busId);
  }

  /**
   * DELETE /routes/:routeId/buses/:busId - Remover bus de ruta
   */
  @Delete(':routeId/buses/:busId')
  removeBus(
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @Param('busId', ParseUUIDPipe) busId: string,
  ) {
    return this.routeService.removeBus(routeId, busId);
  }

  /**
   * DELETE /routes/:id - Soft delete (desactivar ruta)
   */
  @Delete(':id')
  softDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.routeService.softDelete(id);
  }

  /**
   * DELETE /routes/:id/hard - Hard delete (eliminar completamente)
   * Solo si no hay viajes asociados
   */
  @Delete(':id/hard')
  hardDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.routeService.hardDelete(id);
  }
}