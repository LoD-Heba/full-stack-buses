// Backend/src/modules/client/tickets/tickets.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
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
    private readonly dataSource: DataSource,
  ) {}

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const { tripId, seatId, userId, userProfileId, paymentId, ...ticketData } =
      createTicketDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const {
        tripId,
        seatId,
        userId,
        userProfileId,
        paymentId,
        ...ticketData
      } = createTicketDto;

      // Validaciones previas (pueden estar fuera de la transacción)
      if (!userProfileId) {
        throw new BadRequestException('userProfileId es requerido');
      }

      const userProfile = await this.findUserProfile(userProfileId);
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
          userProfile: { id: userProfileId },
          status: TicketStatus.PENDING,
          is_active: true,
        },
      });

      const MAX_PENDING_TICKETS = 3;
      if (pendingTicketsCount >= MAX_PENDING_TICKETS) {
        throw new BadRequestException(
          `El cliente tiene ${pendingTicketsCount} tickets pendientes de pago. Por favor completa o cancela las reservas antes de crear nuevas.`,
        );
      }

      // Validar limite de compras de tickets por viaje
      const userTicketsInTrip = await this.ticketRepository.count({
        where: {
          trip: { id: tripId },
          userProfile: { id: userProfileId },
          status: In([TicketStatus.CONFIRMED, TicketStatus.PENDING]),
          is_active: true,
        },
      });

      const MAX_TICKETS_PER_USER = 5;
      if (userTicketsInTrip >= MAX_TICKETS_PER_USER) {
        throw new BadRequestException(
          `No se pueden comprar más de ${MAX_TICKETS_PER_USER} tickets del mismo viaje`,
        );
      }

      // ====== LOCK DEL TRIP Y SEAT DENTRO DE TRANSACCIÓN ======
      const trip = await queryRunner.manager.findOne(Trip, {
        where: { id: tripId, is_active: true },
        relations: { bus: true, route: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!trip) {
        throw new NotFoundException(`El viaje ${tripId} no existe`);
      }

      if (trip.available_seats <= 0) {
        throw new BadRequestException(
          'No hay asientos disponibles en este viaje',
        );
      }

      const seat = await queryRunner.manager.findOne(Seat, {
        where: { id: seatId, is_active: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!seat || seat.status !== 'disponible') {
        throw new BadRequestException(`El asiento no está disponible`);
      }

      // Generar código único
      const ticketCode = await this.generateTicketCode();

      // Crear ticket
      const ticket = queryRunner.manager.create(Ticket, {
        ...ticketData,
        code: ticketCode,
        trip,
        seat,
        userProfile,
        user,
        payment: paymentId ? await this.findPayment(paymentId) : undefined,
      });

      const savedTicket = await queryRunner.manager.save(ticket);

      // Actualizar asiento
      const newSeatStatus =
        savedTicket.status === TicketStatus.CONFIRMED ? 'ocupado' : 'reservado';
      await queryRunner.manager.update(Seat, seatId, { status: newSeatStatus });

      // Actualizar asientos disponibles del viaje
      if (savedTicket.status === TicketStatus.CONFIRMED) {
        await queryRunner.manager.update(Trip, tripId, {
          available_seats: trip.available_seats - 1,
        });
      }

      await queryRunner.commitTransaction();
      return this.findOne(savedTicket.ticket_id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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
          route: {
            originCity: true,
            destinationCity: true,
          },
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
        userProfile: true,
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
        userProfile: true,
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
        userProfile: true,
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
    const existingTicket = await this.findOne(id);

    const { status, paymentId } = updateTicketDto;

    if (!status && !paymentId) {
      throw new BadRequestException('No hay datos válidos para actualizar');
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;
    }

    if (paymentId) {
      const payment = await this.findPayment(paymentId);
      updateData.payment = payment;
    }

    await this.ticketRepository.update(id, updateData);

    return this.findOne(id);
  }

  async remove(id: string): Promise<Ticket> {
    const ticket = await this.findOne(id);

    if (ticket.status === 'CONFIRMADO') {
      throw new BadRequestException(
        'No se puede eliminar un ticket confirmado. Use la función de cancelación.',
      );
    }

    await this.ticketRepository.update(id, { is_active: false });

    return { ...ticket, is_active: false };
  }

  async cancelTicket(id: string): Promise<Ticket> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const ticket = await this.findOne(id);

      if (ticket.status === TicketStatus.CANCELLED) {
        throw new BadRequestException('El ticket ya está cancelado');
      }

      const trip = await queryRunner.manager.findOne(Trip, {
        where: { id: ticket.trip.id },
        lock: { mode: 'pessimistic_write' },
      });

      await queryRunner.manager.update(Ticket, id, {
        status: TicketStatus.CANCELLED,
      });

      await queryRunner.manager.update(Seat, ticket.seat.id, {
        status: 'disponible',
      });

      await queryRunner.manager.update(Trip, trip.id, {
        available_seats: trip.available_seats + 1,
      });

      await queryRunner.commitTransaction();
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async createTicketWithPayment(
    createTicketDto: CreateTicketDto,
    paymentMethodId: string, // ← Desde el frontend
  ): Promise<{ ticket: Ticket; payment: Payment }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. VALIDACIONES PREVIAS (sin locks)
      const { tripId, seatId, userProfileId, ...ticketData } = createTicketDto;

      const userProfile = await this.findUserProfile(userProfileId);
      const user = createTicketDto.userId
        ? await this.findUser(createTicketDto.userId)
        : undefined;

      // 2. LOCKS PESIMISTAS dentro de transacción
      const trip = await queryRunner.manager.findOne(Trip, {
        where: { id: tripId, is_active: true },
        relations: { bus: true, route: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!trip || trip.available_seats <= 0) {
        throw new BadRequestException('No hay asientos disponibles');
      }

      const seat = await queryRunner.manager.findOne(Seat, {
        where: { id: seatId, is_active: true, status: 'disponible' },
        lock: { mode: 'pessimistic_write' },
      });

      if (!seat) {
        throw new BadRequestException('Asiento no disponible');
      }

      // 3. CREAR PAYMENT en Stripe
      const paymentIntent = await this.stripeService.createPaymentIntent(
        ticketData.price,
        {
          tripId,
          seatId,
          userProfileId,
        },
      );

      // 4. CONFIRMAR PAGO en Stripe
      const confirmedPayment = await this.stripeService.confirmPaymentIntent(
        paymentIntent.id,
        paymentMethodId,
      );

      if (confirmedPayment.status !== 'succeeded') {
        throw new BadRequestException('El pago no se pudo procesar');
      }

      // 5. CREAR PAYMENT en BD
      const payment = queryRunner.manager.create(Payment, {
        amount: ticketData.price,
        method: PaymentMethod.CARD,
        status: PaymentStatus.COMPLETED,
        transaction_reference: paymentIntent.id,
        payment_date: new Date(),
      });

      const savedPayment = await queryRunner.manager.save(payment);

      // 6. CREAR TICKET
      const ticketCode = await this.generateTicketCode();
      const ticket = queryRunner.manager.create(Ticket, {
        ...ticketData,
        code: ticketCode,
        status: TicketStatus.CONFIRMED,
        trip,
        seat,
        userProfile,
        user,
        payment: savedPayment,
      });

      const savedTicket = await queryRunner.manager.save(ticket);

      // 7. ACTUALIZAR ASIENTO Y VIAJE
      await queryRunner.manager.update(Seat, seatId, { status: 'ocupado' });
      await queryRunner.manager.update(Trip, tripId, {
        available_seats: trip.available_seats - 1,
      });

      await queryRunner.commitTransaction();

      return {
        ticket: await this.findOne(savedTicket.ticket_id),
        payment: savedPayment,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      // Si Stripe cobró pero falló algo, reembolsar automáticamente
      // (implementar según tu lógica de negocio)

      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async confirmTicket(id: string): Promise<Ticket> {
    // Usar queryRunner para manejar la transacción manualmente
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Buscar el ticket (sin lock aún)
      const ticket = await this.findOne(id);

      // 2. Validaciones de estado del ticket
      if (ticket.status === TicketStatus.CONFIRMED) {
        throw new BadRequestException('El ticket ya está confirmado');
      }

      if (ticket.status === TicketStatus.CANCELLED) {
        throw new BadRequestException(
          'No se puede confirmar un ticket cancelado',
        );
      }

      // 3. Buscar el trip CON LOCK dentro de la transacción
      const trip = await queryRunner.manager.findOne(Trip, {
        where: { id: ticket.trip.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!trip) {
        throw new NotFoundException(`El viaje ${ticket.trip.id} no existe`);
      }

      // 4. Verificar disponibilidad de asientos
      if (trip.available_seats <= 0) {
        throw new BadRequestException(
          'Ya no hay asientos disponibles en este viaje',
        );
      }

      // 5. Actualizar el ticket
      await queryRunner.manager.update(Ticket, id, {
        status: TicketStatus.CONFIRMED,
      });

      // 6. Actualizar el asiento
      await queryRunner.manager.update(Seat, ticket.seat.id, {
        status: 'ocupado',
      });

      // 7. Actualizar asientos disponibles del viaje
      await queryRunner.manager.update(Trip, ticket.trip.id, {
        available_seats: trip.available_seats - 1,
      });

      // 8. Commit de la transacción
      await queryRunner.commitTransaction();

      // 9. Retornar el ticket actualizado
      return this.findOne(id);
    } catch (error) {
      // Rollback en caso de error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Liberar el queryRunner
      await queryRunner.release();
    }
  }

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
      relations: { bus: true, route: true },
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
    await this.tripService.updateAvailableSeats(ticket.trip.id);
    return this.findOne(id);
  }
}
