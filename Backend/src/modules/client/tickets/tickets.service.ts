import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket } from './entities/ticket.entity';
import { User } from 'src/modules/admin/user/entities/user.entity';
import { Trip } from '../trip/entities/trip.entity';
import { Seat } from '../seat/entities/seat.entity';
import { Payment } from '../payment/entities/payment.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginatedResponse } from 'src/modules/auth/interfaces/auth.interfaces';
import { TripService } from '../trip/trip.service';
import {
  PaymentStatus,
  TicketStatus,
  TripStatus,
} from 'src/common/enums/status.enum';
import { UserProfile } from 'src/modules/admin/user-profile/entities/user-profile.entity';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,

    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,

    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,

    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly tripService: TripService,
  ) {}

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const { tripId, seatId, userId, userProfileId, paymentId, ...ticketData } =
      createTicketDto;

    // ✅ VALIDAR: userProfileId es obligatorio
    if (!userProfileId) {
      throw new BadRequestException('userProfileId es requerido');
    }
    const userProfile = await this.findUserProfile(userProfileId);
    // Validar que el usuario existe y está activo
    // ✅ OPCIONAL: Obtener User si se proporciona (usuario registrado)
    let user: User | undefined;
    if (userId) {
      user = await this.findUser(userId);

      if (
        !user.profile?.firstName ||
        !user.profile?.lastName ||
        !user.profile?.documentNumber
      ) {
        throw new BadRequestException('El usuario debe completar su perfil');
      }
    }

    // ✅ VALIDAR: UserProfile tiene datos completos
    if (
      !userProfile.firstName ||
      !userProfile.lastName ||
      !userProfile.documentNumber
    ) {
      throw new BadRequestException(
        'El cliente debe tener nombre, apellido y documento completos',
      );
    }
    // Validar que un usuario no tenga mas de 3 tickets pendientes
    const pendingTicketsCount = await this.ticketRepository.count({
      where: {
        user: { id: userId },
        status: TicketStatus.PENDING,
        is_active: true,
      },
    });

    const MAX_PENDING_TICKETS = 3;
    if (pendingTicketsCount >= MAX_PENDING_TICKETS) {
      throw new BadRequestException(
        `Tienes ${pendingTicketsCount} tickets pendientes de pago. Por favor completa o cancela tus reservas antes de crear nuevas.`,
      );
    }

    //Validar limite de compras de tickets
    const userTicketsInTrip = await this.ticketRepository.count({
      where: {
        trip: { id: tripId },
        user: { id: userId },
        status: In([TicketStatus.CONFIRMED, TicketStatus.PENDING]),
        is_active: true,
      },
    });

    const MAX_TICKETS_PER_USER = 5;
    if (userTicketsInTrip >= MAX_TICKETS_PER_USER) {
      throw new BadRequestException(
        `No puedes comprar más de ${MAX_TICKETS_PER_USER} tickets del mismo viaje`,
      );
    }
    // Validar Trip
    const trip = await this.findTrip(tripId);

    // Verificar que el viaje esté programado y no haya comenzado
    if (trip.status !== TripStatus.SCHEDULED) {
      throw new BadRequestException(
        'Solo se pueden comprar tickets para viajes programados',
      );
    }

    const minutosAntesDeSalida =
      (new Date(trip.departure_time).getTime() - new Date().getTime()) /
      (1000 * 60);

    if (minutosAntesDeSalida < 30) {
      throw new BadRequestException(
        'No se pueden comprar tickets con menos de 30 minutos antes de la salida',
      );
    }
    if (new Date(trip.departure_time) <= new Date()) {
      throw new BadRequestException(
        'No se pueden comprar tickets para viajes que ya comenzaron',
      );
    }

    if (trip.available_seats <= 0) {
      throw new BadRequestException(
        'No hay asientos disponibles en este viaje',
      );
    }

    const profile = userProfile;
    if (!profile.firstName || !profile.lastName || !profile.documentNumber) {
      throw new BadRequestException(
        'El perfil del usuario debe tener nombre, apellido y número de documento',
      );
    }

    // Validar Seat
    const seat = await this.findSeat(seatId);

    //Valicacion de asientos inexistentes
    const seatBelongsToBus = await this.seatRepository
      .createQueryBuilder('seat')
      .innerJoin('seat.stacks', 'stack')
      .innerJoin('stack.bus', 'bus')
      .where('seat.id = :seatId', { seatId })
      .andWhere('bus.id = :busId', { busId: trip.bus.id })
      .getOne();

    if (!seatBelongsToBus) {
      throw new BadRequestException(
        `El asiento ${seat.seat_code} no pertenece al bus de este viaje`,
      );
    }
    // Verificar que el asiento no esté ocupado en este viaje
    const existingTicket = await this.ticketRepository.findOne({
      where: {
        trip: { id: tripId },
        seat: { id: seatId },
        status: In([TicketStatus.CONFIRMED, TicketStatus.PENDING]), // AGREGAR PENDING
        is_active: true,
      },
    });

    if (existingTicket) {
      throw new BadRequestException(
        `El asiento ${seat.seat_number} ya está reservado en este viaje`,
      );
    }

    // Verificar que el usuario no tenga ya un ticket confirmado para este viaje
    const userTicketInTrip = await this.ticketRepository.findOne({
      where: {
        trip: { id: tripId },
        user: { id: userId },
        status: TicketStatus.CONFIRMED,
        is_active: true,
      },
    });

    if (userTicketInTrip) {
      throw new BadRequestException(
        'El usuario ya tiene un ticket confirmado para este viaje',
      );
    }

    // Validar Payment si se proporciona
    let payment: Payment | undefined;
    if (paymentId) {
      payment = await this.findPayment(paymentId);
    }
    if (payment) {
      if (Math.abs(payment.amount - ticketData.price) > 0.01) {
        throw new BadRequestException(
          `El monto del pago (${payment.amount}) no coincide con el precio del ticket (${ticketData.price})`,
        );
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new BadRequestException(
          'Solo se pueden asociar pagos completados a tickets',
        );
      }
    }

    // Generar código único del ticket
    const ticketCode = await this.generateTicketCode();

    // Crear el ticket
    const ticket = this.ticketRepository.create({
      ...ticketData,
      code: ticketCode,
      trip,
      seat,
      userProfile,
      user,
      payment,
    });

    const savedTicket = await this.ticketRepository.save(ticket);
    await this.tripService.updateAvailableSeats(tripId);
    return this.findOne(savedTicket.ticket_id);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Ticket>> {
    const { page = 1, limit = 10 } = paginationDto;

    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * take;

    const total = await this.ticketRepository.count({
      where: { is_active: true },
    });

    const lastPage = Math.ceil(total / take);
    const hasNextPage = page < lastPage;
    const hasPrevPage = page > 1;

    const data = await this.ticketRepository.find({
      where: { is_active: true },
      relations: {
        trip: {
          route: true,
          bus: true,
        },
        seat: true,
        user: {
          profile: true,
        },
        userProfile: true,
        payment: true,
      },
      order: { created_at: 'DESC' },
      skip,
      take,
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage,
        limit: take,
        hasNextPage,
        hasPrevPage,
      },
    };
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { ticket_id: id, is_active: true },
      relations: {
        trip: {
          route: {
            originCity: true,
            destinationCity: true,
          },
          bus: true,
        },
        seat: {
          stacks: true,
        },
        user: {
          profile: true,
        },
        userProfile: true,
        payment: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException(`El ticket con ID ${id} no existe`);
    }

    return ticket;
  }

  async findByUser(userId: string): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: {
        user: { id: userId },
        is_active: true,
      },
      relations: {
        trip: {
          route: {
            originCity: true,
            destinationCity: true,
          },
        },
        seat: true,
        payment: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  private async findUserProfile(userProfileId: string): Promise<UserProfile> {
    const userProfile = await this.userProfileRepository.findOne({
      where: { id: userProfileId, isActive: true },
    });

    if (!userProfile) {
      throw new NotFoundException(
        `El cliente con ID ${userProfileId} no existe o no está activo`,
      );
    }

    return userProfile;
  }

  async findByTrip(tripId: string): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: {
        trip: { id: tripId },
        is_active: true,
      },
      relations: {
        seat: true,
        user: {
          profile: true,
        },
      },
      order: { seat: { seat_number: 'ASC' } },
    });
  }

  async getUserTicketHistory(userId: string): Promise<{
    upcoming: Ticket[];
    past: Ticket[];
    cancelled: Ticket[];
  }> {
    const tickets = await this.ticketRepository.find({
      where: {
        user: { id: userId },
        is_active: true,
      },
      relations: {
        trip: {
          route: {
            originCity: true,
            destinationCity: true,
          },
        },
        seat: true,
        payment: true,
      },
      order: { created_at: 'DESC' },
    });

    const now = new Date();

    return {
      upcoming: tickets.filter(
        (t) =>
          t.status === TicketStatus.CONFIRMED &&
          new Date(t.trip.departure_time) > now,
      ),
      past: tickets.filter(
        (t) =>
          t.status === TicketStatus.CONFIRMED &&
          new Date(t.trip.departure_time) <= now,
      ),
      cancelled: tickets.filter((t) => t.status === TicketStatus.CANCELLED),
    };
  }

  async update(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket> {
    // Verificar que el ticket existe
    const existingTicket = await this.findOne(id);

    // Solo permitir actualizar ciertos campos
    const { status, paymentId } = updateTicketDto;

    if (!status && !paymentId) {
      throw new BadRequestException('No hay datos válidos para actualizar');
    }

    const updateData: any = {};

    // Actualizar estado si se proporciona
    if (status) {
      updateData.status = status;
    }

    // Actualizar payment si se proporciona
    if (paymentId) {
      const payment = await this.findPayment(paymentId);
      updateData.payment = payment;
    }

    await this.ticketRepository.update(id, updateData);

    return this.findOne(id);
  }

  async remove(id: string): Promise<Ticket> {
    const ticket = await this.findOne(id);

    // Solo permitir cancelar tickets pendientes
    if (ticket.status === 'CONFIRMADO') {
      throw new BadRequestException(
        'No se puede eliminar un ticket confirmado. Use la función de cancelación.',
      );
    }

    // Soft delete
    await this.ticketRepository.update(id, { is_active: false });

    return { ...ticket, is_active: false };
  }

  async cancelTicket(id: string): Promise<Ticket> {
    const ticket = await this.findOne(id);

    if (ticket.status === TicketStatus.CANCELLED) {
      // USAR ENUM
      throw new BadRequestException('El ticket ya está cancelado');
    }
    const horasAntesDeSalida =
      (new Date(ticket.trip.departure_time).getTime() - new Date().getTime()) /
      (1000 * 60 * 60);

    if (horasAntesDeSalida < 2) {
      throw new BadRequestException(
        'No se pueden cancelar tickets con menos de 2 horas antes de la salida',
      );
    }
    // Verificar si el viaje ya comenzó
    if (new Date(ticket.trip.departure_time) <= new Date()) {
      throw new BadRequestException(
        'No se puede cancelar un ticket de un viaje que ya comenzó',
      );
    }

    await this.ticketRepository.update(id, {
      status: TicketStatus.CANCELLED,
    });

    // ====== AGREGAR AQUÍ ======
    // Actualizar asientos disponibles del viaje
    await this.tripService.updateAvailableSeats(ticket.trip.id);
    // ==========================

    return this.findOne(id);
  }
  async confirmTicket(id: string): Promise<Ticket> {
    const ticket = await this.findOne(id);

    if (ticket.status === TicketStatus.CONFIRMED) {
      // USAR ENUM
      throw new BadRequestException('El ticket ya está confirmado');
    }

    if (ticket.status === TicketStatus.CANCELLED) {
      // USAR ENUM
      throw new BadRequestException(
        'No se puede confirmar un ticket cancelado',
      );
    }
    const trip = await this.tripRepository.findOne({
      where: { id: ticket.trip.id },
      lock: { mode: 'pessimistic_write' }, // Lock para evitar race conditions
    });

    if (!trip) {
      throw new NotFoundException(`El viaje ${ticket.trip.id} no existe`);
    }

    if (trip.available_seats <= 0) {
      throw new BadRequestException(
        'Ya no hay asientos disponibles en este viaje',
      );
    }

    await this.ticketRepository.update(id, {
      status: TicketStatus.CONFIRMED,
    });

    // ====== AGREGAR AQUÍ ======
    // Actualizar asientos disponibles del viaje
    await this.tripService.updateAvailableSeats(ticket.trip.id);
    // ==========================

    return this.findOne(id);
  }
  // Métodos auxiliares privados
  private async generateTicketCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = (await this.ticketRepository.count()) + 1;
    return `TCK-${year}-${count.toString().padStart(6, '0')}`;
  }

  private async findUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
      relations: { profile: true },
    });

    if (!user) {
      throw new NotFoundException(
        `El usuario ${userId} no existe o no está activo`,
      );
    }

    return user;
  }

  private async findTrip(tripId: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id: tripId, is_active: true },
      relations: { bus: true, route: true }, // AGREGAR RELACIONES
    });

    if (!trip) {
      throw new NotFoundException(`El viaje ${tripId} no existe`);
    }

    return trip;
  }

  private async findSeat(seatId: string): Promise<Seat> {
    const seat = await this.seatRepository.findOne({
      where: { id: seatId, is_active: true },
    });

    if (!seat) {
      throw new NotFoundException(`El asiento ${seatId} no existe`);
    }

    return seat;
  }

  private async findPayment(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException(`El pago ${paymentId} no existe`);
    }

    return payment;
  }
  async changeTicketStatus(id: string, status: string): Promise<Ticket> {
    const ticket = await this.findOne(id);
    await this.ticketRepository.update(id, { status });

    // Actualizar asientos disponibles del viaje
    await this.tripService.updateAvailableSeats(ticket.trip.id);

    return this.findOne(id);
  }
}
