import { InjectRepository } from "@nestjs/typeorm";
import { Trip } from "./entities/trip.entity";
import { In, Repository } from "typeorm";
import { Injectable } from "@nestjs/common";
import { TripStatus } from "src/common/enums/status.enum";
import { Ticket } from "../tickets/entities/ticket.entity";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class TripStatusJob {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>
  ) {}

  @Cron('*/5 * * * *') // Cada 5 minutos
  async updateTripStatuses() {
    const now = new Date();

    // 1. Viajes que ya deberían estar en progreso
    await this.tripRepository
      .createQueryBuilder()
      .update(Trip)
      .set({ status: TripStatus.IN_PROGRESS })
      .where('status = :scheduled', { scheduled: TripStatus.SCHEDULED })
      .andWhere('departure_time <= :now', { now })
      .andWhere('arrival_time > :now', { now })
      .andWhere('is_active = :active', { active: true })
      .execute();

    // 2. Viajes que ya deberían estar completados
    const completedTrips = await this.tripRepository
      .createQueryBuilder('trip')
      .where('status = :inProgress', { inProgress: TripStatus.IN_PROGRESS })
      .andWhere('arrival_time <= :now', { now })
      .andWhere('is_active = :active', { active: true })
      .getMany();

    for (const trip of completedTrips) {
      await this.completeTrip(trip.id);
    }
  }

  private async completeTrip(tripId: string) {
    // Desactivar tickets
    await this.tripRepository
      .createQueryBuilder()
      .relation(Trip, 'tickets')
      .of(tripId)
      .loadMany()
      .then(tickets => {
        const ticketIds = tickets.map(t => t.ticket_id);
        return this.ticketRepository.update(
          { ticket_id: In(ticketIds) },
          { is_active: false }
        );
      });

    // Completar viaje
    await this.tripRepository.update(tripId, {
      status: TripStatus.COMPLETED,
      is_active: false
    });
  }
}

