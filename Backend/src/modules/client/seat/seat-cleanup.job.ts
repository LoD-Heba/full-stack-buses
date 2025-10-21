import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Seat } from './entities/seat.entity';
import { TicketStatus, SeatStatus, TripStatus } from 'src/common/enums/status.enum';
import { Trip } from '../trip/entities/trip.entity';

@Injectable()
export class SeatCleanupJob {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,

    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,

    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
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
      relations: ['seat', 'trip'],
    });

    if (expiredTickets.length === 0) return;

    // Cancelar tickets
    const ticketIds = expiredTickets.map((t) => t.ticket_id);
    await this.ticketRepository.update(
      { ticket_id: In(ticketIds) },
      { status: TicketStatus.CANCELLED, is_active: false },
    );

    // Liberar asientos
    const seatIds = expiredTickets.map((t) => t.seat.id);
    await this.seatRepository.update(
      { id: In(seatIds) },
      { status: SeatStatus.AVAILABLE },
    );

    const tripIds = [...new Set(expiredTickets.map((t) => t.trip.id))];

    for (const tripId of tripIds) {
      const trip = await this.tripRepository.findOne({
        where: { id: tripId },
        relations: { tickets: true },
      });

      if (trip) {
        const confirmedCount = trip.tickets.filter(
          (t) => t.status === TicketStatus.CONFIRMED && t.is_active,
        ).length;

        const totalSeats = await this.seatRepository
          .createQueryBuilder('seat')
          .leftJoin('seat.stacks', 'stack')
          .where('stack.bus_id = :busId', { busId: trip.bus.id })
          .andWhere('seat.is_active = true')
          .getCount();

        await this.tripRepository.update(tripId, {
          available_seats: totalSeats - confirmedCount,
        });
      }
    }

    console.log(
      `✅ Liberados ${seatIds.length} asientos de ${tripIds.length} viajes`,
    );
  }

  /**
   * Libera asientos de viajes finalizados
   * Se ejecuta cada hora
   */
  @Cron('0 * * * *') // Cada hora
  async releaseCompletedTripSeats() {
    const now = new Date();

    // Buscar viajes completados o cancelados que aún tienen asientos ocupados
    const completedTrips = await this.tripRepository.find({
      where: [
        { status: TripStatus.COMPLETED, is_active: true },
        { status: TripStatus.CANCELLED, is_active: true },
      ],
      relations: ['tickets', 'tickets.seat', 'bus'],
    });

    let totalSeatsReleased = 0;
    let tripsProcessed = 0;

    for (const trip of completedTrips) {
      // Obtener todos los asientos ocupados/reservados de este viaje
      const occupiedSeats = trip.tickets
        .filter((ticket) => 
          ticket.is_active && 
          ticket.seat &&
          (ticket.seat.status === SeatStatus.OCCUPIED || 
           ticket.seat.status === SeatStatus.RESERVED)
        )
        .map((ticket) => ticket.seat.id);

      if (occupiedSeats.length > 0) {
        // Liberar asientos
        await this.seatRepository.update(
          { id: In(occupiedSeats) },
          { status: SeatStatus.AVAILABLE }
        );

        totalSeatsReleased += occupiedSeats.length;
        tripsProcessed++;

        // Actualizar available_seats del viaje a la capacidad total
        const totalSeats = await this.seatRepository.count({
          where: {
            stacks: { bus: { id: trip.bus.id } },
            is_active: true,
          },
        });

        await this.tripRepository.update(trip.id, {
          available_seats: totalSeats,
        });
      }
    }

    if (tripsProcessed > 0) {
      console.log(
        `✅ Liberados ${totalSeatsReleased} asientos de ${tripsProcessed} viajes finalizados`,
      );
    }
  }

  /**
   * Desactiva tickets de viajes finalizados hace más de 30 días
   * Se ejecuta diariamente a las 2:00 AM
   */
  @Cron('0 2 * * *')
  async archiveOldTickets() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Buscar viajes completados hace más de 30 días
    const oldTrips = await this.tripRepository.find({
      where: {
        status: TripStatus.COMPLETED,
        departure_time: LessThan(thirtyDaysAgo),
        is_active: true,
      },
      relations: ['tickets'],
    });

    let ticketsArchived = 0;

    for (const trip of oldTrips) {
      const activeTicketIds = trip.tickets
        .filter((t) => t.is_active)
        .map((t) => t.ticket_id);

      if (activeTicketIds.length > 0) {
        await this.ticketRepository.update(
          { ticket_id: In(activeTicketIds) },
          { is_active: false }
        );
        ticketsArchived += activeTicketIds.length;
      }
    }

    if (ticketsArchived > 0) {
      console.log(
        `📦 Archivados ${ticketsArchived} tickets de viajes antiguos`,
      );
    }
  }
} 