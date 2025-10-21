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
import { TicketService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketService.create(createTicketDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.ticketService.findAll(paginationDto);
  }
 /**
   * Valida un ticket por código y retorna su QR
   * GET /tickets/qr/validate/:code
   */
  @Get('qr/validate/:code')
  validateQRCode(@Param('code') code: string) {
    return this.ticketService.getTicketByCodeWithQR(code);
  }
  @Get('trip/:tripId')
  findByTrip(@Param('tripId', ParseUUIDPipe) tripId: string) {
    return this.ticketService.findByTrip(tripId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketService.update(id, updateTicketDto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketService.cancelTicket(id);
  }

  @Patch(':id/confirm')
  confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketService.confirmTicket(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketService.remove(id);
  }

    /**
   * Obtiene un ticket con su QR generado
   * GET /tickets/:id/qr
   */
  @Get(':id/qr')
  getTicketQR(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketService.getTicketWithQR(id);
  }
@Get('trip/:tripId/occupied-seats')
getOccupiedSeats(@Param('tripId', ParseUUIDPipe) tripId: string) {
  return this.ticketService.getOccupiedSeatsByTrip(tripId);
}
}
