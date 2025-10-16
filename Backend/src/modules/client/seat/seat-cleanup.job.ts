import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Seat } from './entities/seat.entity';
import { TicketStatus } from 'src/common/enums/status.enum';

@Injectable()
export class SeatCleanupJob {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
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
      relations: ['seat'],
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

    console.log(`✅ Liberados ${seatIds.length} asientos de reservas expiradas`);
  }
}