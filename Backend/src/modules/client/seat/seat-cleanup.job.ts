import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Seat } from './entities/seat.entity';
import { TicketStatus } from 'src/common/enums/status.enum';
import { Trip } from '../trip/entities/trip.entity';

@Injectable()
export class SeatCleanupJob {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,

    @InjectRepository(Trip)
    private readonly tripRepository : Repository<Trip>
  ) {}

  @Cron('*/5 * * * *') // Cada 5 minutos
  async releaseExpiredReservations() {
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() - 15); // 15 minutos

    // Encontrar tickets pendientes expirados
    const expiredTickets = await this.ticketRepository.find({
      where: {
        status: TicketStatus.PENDING,
        is_active: true,
        created_at: LessThan(expirationTime),
      },
      relations: ['seat','trip'],
    });

    if (expiredTickets.length === 0) return;

    // Cancelar tickets
    const ticketIds = expiredTickets.map(t => t.ticket_id);
    await this.ticketRepository.update(
      { ticket_id: In(ticketIds) },
      { status: TicketStatus.CANCELLED, is_active: false }
    );

    // Liberar asientos
    const seatIds = expiredTickets.map(t => t.seat.id);
    await this.seatRepository.update(
      { id: In(seatIds) },
      { status: 'disponible' }
    );

    const tripIds = [...new Set(expiredTickets.map(t => t.trip.id))];
  
  for (const tripId of tripIds) {
    const trip = await this.tripRepository.findOne({
      where: { id: tripId },
      relations: { tickets: true }
    });

    if (trip) {
      const confirmedCount = trip.tickets.filter(
        t => t.status === TicketStatus.CONFIRMED && t.is_active
      ).length;

      const totalSeats = await this.seatRepository
        .createQueryBuilder('seat')
        .leftJoin('seat.stacks', 'stack')
        .where('stack.bus_id = :busId', { busId: trip.bus.id })
        .andWhere('seat.is_active = true')
        .getCount();

      await this.tripRepository.update(tripId, {
        available_seats: totalSeats - confirmedCount
      });
    }}

    console.log(`✅ Liberados ${seatIds.length} asientos de ${tripIds.length} viajes`);
  }
}