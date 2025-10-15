// Backend/src/modules/client/bus/bus.controller.ts
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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BusService } from './bus.service';
import { CreateBusDto, BusStatus } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { SearchBusDto } from './dto/search-bus.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { createMulterOptions } from 'src/config/upload.config';

@Controller('buses')
export class BusController {
  constructor(private readonly busService: BusService) {}

  @Post()
  create(@Body() createBusDto: CreateBusDto) {
    return this.busService.create(createBusDto);
  }

  @Post(':id/upload-image')
  @UseInterceptors(FileInterceptor('image', createMulterOptions('buses')))
  async uploadImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ninguna imagen');
    }
    const imageUrl = `/uploads/buses/${file.filename}`;
    return this.busService.updateImageUrl(id, imageUrl);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.busService.findAll(paginationDto);
  }

  @Get('search')
  search(
    @Query() searchDto: SearchBusDto,
    @Query() paginationDto: PaginationDto,
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
  
  @Get(':id/layout')
  getBusLayout(@Param('id', ParseUUIDPipe) id: string) {
    return this.busService.getBusLayout(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBusDto: UpdateBusDto,
  ) {
    return this.busService.update(id, updateBusDto);
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status', new ParseEnumPipe(BusStatus)) status: BusStatus,
  ) {
    return this.busService.changeStatus(id, status);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.busService.remove(id);
  }

  @Delete(':id/hard-delete')
  hardDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.busService.hardDelete(id);
  }

  @Get(':id/layout/trip/:tripId')
getBusLayoutForTrip(
  @Param('id', ParseUUIDPipe) id: string,
  @Param('tripId', ParseUUIDPipe) tripId: string,
) {
  return this.busService.getBusLayoutForTrip(id, tripId);
}
}
