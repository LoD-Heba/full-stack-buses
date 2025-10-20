import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { CityService } from './city.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createMulterOptions } from 'src/config/upload.config';

@Controller('city')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Post()
  create(@Body() createCityDto: CreateCityDto) {
    return this.cityService.create(createCityDto);
  }

  @Post(':id/upload-image')
  @UseInterceptors(FileInterceptor('image', createMulterOptions('cities')))
  async uploadImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ninguna imagen');
    }

    if (!file.filename) {
      throw new BadRequestException('Error al procesar el archivo');
    }

    const imageUrl = `/uploads/cities/${file.filename}`;
    return this.cityService.updateImageUrl(id, imageUrl);
  }

  /**
   * GET /city - Obtener ciudades activas
   * GET /city?inactive=true - Obtener ciudades inactivas
   */
  @Get()
  findAll(@Query('inactive') inactive?: string) {
    const includeInactive = inactive === 'true';
    return this.cityService.findAll(includeInactive);
  }

  /**
   * GET /city/inactive - Lista de ciudades inactivas
   */
  @Get('list/inactive')
  findInactive() {
    return this.cityService.findInactive();
  }

  /**
   * GET /city/:id/routes - Obtener rutas asociadas a una ciudad
   */
  @Get(':id/routes')
  getRelatedRoutes(@Param('id', ParseUUIDPipe) id: string) {
    return this.cityService.getRelatedRoutes(id);
  }

  /**
   * GET /city/:id - Obtener una ciudad específica
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.cityService.findOne(id);
  }

  /**
   * PATCH /city/:id - Actualizar una ciudad
   */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCityDto: UpdateCityDto,
  ) {
    return this.cityService.update(id, updateCityDto);
  }

  /**
   * PATCH /city/:id/reactivate - Reactivar una ciudad inactiva
   */
  @Patch(':id/reactivate')
  reactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.cityService.reactivate(id);
  }

  /**
   * DELETE /city/:id - Soft delete (desactivar ciudad)
   */
  @Delete(':id')
  softDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.cityService.softDelete(id);
  }

  /**
   * DELETE /city/:id/hard - Hard delete (eliminar completamente)
   * Solo si no hay rutas asociadas
   */
  @Delete(':id/hard')
  hardDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.cityService.hardDelete(id);
  }
}