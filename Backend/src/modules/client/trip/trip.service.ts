import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  In,
} from 'typeorm';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { SearchTripsDto } from './dto/search-trip.dto';
import { Trip } from './entities/trip.entity';
import { Bus } from '../bus/entities/bus.entity';
import { Route } from '../route/entities/route.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginatedResponse } from 'src/modules/auth/interfaces/auth.interfaces';
import { User } from 'src/modules/admin/user/entities/user.entity';
import { UserProfile } from 'src/modules/admin/user-profile/entities/user-profile.entity';
import { TripStatus, TicketStatus } from 'src/common/enums/status.enum';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Seat } from '../seat/entities/seat.entity';
@Injectable()
export class TripService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,

    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,

    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,

    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,

    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
  ) {}

  async create(createTripDto: CreateTripDto): Promise<Trip> {
    const { busId, routeId, departure_time, arrival_time, ...tripData } =
      createTripDto;

    // Validar fechas
    const departureDate = new Date(departure_time);
    const arrivalDate = new Date(arrival_time);

    if (departureDate >= arrivalDate) {
      throw new BadRequestException(
        'La fecha de llegada debe ser posterior a la fecha de salida',
      );
    }

    if (departureDate < new Date()) {
      throw new BadRequestException(
        'La fecha de salida no puede ser en el pasado',
      );
    }
    // Evitar que la hora programada de salida no sea 10 minutos despues
    const hoursUntilDeparture =
      (departureDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);

    const MINIMUM_LEAD_TIME_HOURS = 2;
    if (hoursUntilDeparture < MINIMUM_LEAD_TIME_HOURS) {
      throw new BadRequestException(
        `Los viajes deben crearse con al menos ${MINIMUM_LEAD_TIME_HOURS} horas de anticipación`,
      );
    }
    // Validar que un viaje no llegue en mas de 1 dia
    const tripDurationHours =
      (arrivalDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60);

    if (tripDurationHours > 24) {
      throw new BadRequestException(
        'La duración máxima de un viaje es 24 horas',
      );
    }

    if (tripDurationHours < 0.5) {
      throw new BadRequestException(
        'La duración mínima de un viaje es 30 minutos',
      );
    }
    // Validar hora de salida de bus
    const departureHour = departureDate.getHours();

    // Validar horario comercial (ejemplo: 5:00 AM - 11:00 PM)
    if (departureHour < 5 || departureHour >= 23) {
      throw new BadRequestException(
        'Los viajes solo pueden programarse entre las 5:00 AM y las 11:00 PM',
      );
    }

    // Validar que el bus existe y está activo
    const bus = await this.findBus(busId);

    // Validar que la ruta existe
    const route = await this.findRoute(routeId);

    //Validar viajes simultaneos
    const simultaneousTrips = await this.tripRepository
      .createQueryBuilder('trip')
      .where('trip.route = :routeId', { routeId })
      .andWhere('trip.is_active = :active', { active: true })
      .andWhere('trip.status = :scheduled', { scheduled: TripStatus.SCHEDULED })
      .andWhere(
        '(trip.departure_time BETWEEN :start AND :end) OR ' +
          '(trip.arrival_time BETWEEN :start AND :end)',
        { start: departure_time, end: arrival_time },
      )
      .getCount();

    const MAX_SIMULTANEOUS_TRIPS = 5;
    if (simultaneousTrips >= MAX_SIMULTANEOUS_TRIPS) {
      throw new BadRequestException(
        `No se pueden tener más de ${MAX_SIMULTANEOUS_TRIPS} viajes simultáneos en la misma ruta`,
      );
    }

    // Validar que la duración de un viaje concuerde con la duración de la ruta
    if (route.approx_duration) {
      const [routeHours, routeMinutes] = route.approx_duration
        .split(':')
        .map(Number);
      const routeDurationHours = routeHours + routeMinutes / 60;

      const tripDurationHours =
        (arrivalDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60);

      // Permitir máximo 100% de variación (el doble de tiempo por tráfico, etc)
      const maxDuration = routeDurationHours * 2;
      const minDuration = routeDurationHours * 0.5;

      if (tripDurationHours > maxDuration || tripDurationHours < minDuration) {
        throw new BadRequestException(
          `La duración del viaje (${tripDurationHours.toFixed(1)}h) no es coherente con la duración de la ruta (${routeDurationHours.toFixed(1)}h). Rango permitido: ${minDuration.toFixed(1)}h - ${maxDuration.toFixed(1)}h`,
        );
      }
    }

    //Validar precio intermedio entre precio base y de boleto
    if (route.base_price) {
      const priceVariation =
        Math.abs(tripData.price - route.base_price) / route.base_price;

      // Permitir máximo 50% de variación
      if (priceVariation > 0.5) {
        throw new BadRequestException(
          `El precio del viaje (${tripData.price}) varía más del 50% respecto al precio base de la ruta (${route.base_price})`,
        );
      }
    }
    // Verificar que el bus no tenga otro viaje en conflicto de horarios
    const conflictingTrip = await this.tripRepository
      .createQueryBuilder('trip')
      .where('trip.bus = :busId', { busId })
      .andWhere('trip.is_active = :active', { active: true })
      .andWhere('trip.status != :cancelled', { cancelled: 'CANCELLED' })
      .andWhere(
        '(trip.departure_time BETWEEN :start AND :end) OR (trip.arrival_time BETWEEN :start AND :end) OR (trip.departure_time <= :start AND trip.arrival_time >= :end)',
        {
          start: departure_time,
          end: arrival_time,
        },
      )
      .getOne();

    if (conflictingTrip) {
      throw new BadRequestException(
        `El bus ya tiene un viaje programado que se solapa con estos horarios`,
      );
    }

    //Validar tiempo de llegada de bus
    const MINIMUM_TURNAROUND_MINUTES = 60; // 1 hora de turnaround

    const recentTrip = await this.tripRepository
      .createQueryBuilder('trip')
      .where('trip.bus = :busId', { busId })
      .andWhere('trip.is_active = :active', { active: true })
      .andWhere('trip.status != :cancelled', {
        cancelled: TripStatus.CANCELLED,
      })
      .andWhere('trip.arrival_time <= :newDeparture', {
        newDeparture: departure_time,
      })
      .orderBy('trip.arrival_time', 'DESC')
      .getOne();

    if (recentTrip) {
      const minutesBetween =
        (new Date(departure_time).getTime() -
          new Date(recentTrip.arrival_time).getTime()) /
        (1000 * 60);

      if (minutesBetween < MINIMUM_TURNAROUND_MINUTES) {
        throw new BadRequestException(
          `Debe haber al menos ${MINIMUM_TURNAROUND_MINUTES} minutos entre la llegada del viaje anterior y la salida de este viaje`,
        );
      }
    }
    // Verificar que el bus está asignado a la ruta
    const busInRoute = route.buses?.some((b) => b.id === busId);
    if (!busInRoute) {
      throw new BadRequestException(
        `El bus ${bus.plate} no está asignado a la ruta ${route.name}. Debe asignar el bus a la ruta primero.`,
      );
    }
    // ====================================

    // Calcular asientos disponibles basado en el bus
    const availableSeats = await this.calculateAvailableSeats(busId);

    //Validar que el bus no tenga 0 asientos
    if (availableSeats === 0) {
      throw new BadRequestException(
        `No se puede crear un viaje porque el bus ${bus.plate} no tiene asientos activos`,
      );
    }

    if (availableSeats < 15) {
      throw new BadRequestException(
        `El bus debe tener al menos 15 asientos activos para operar un viaje (actual: ${availableSeats})`,
      );
    }

    // Crear el trip
    const trip = this.tripRepository.create({
      ...tripData,
      departure_time: departureDate,
      arrival_time: arrivalDate,
      available_seats: availableSeats,
      bus,
      route: route,
    });

    return this.tripRepository.save(trip);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Trip>> {
    const { page = 1, limit = 10 } = paginationDto;

    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * take;

    const total = await this.tripRepository.count({
      where: { is_active: true },
    });

    const lastPage = Math.ceil(total / take);
    const hasNextPage = page < lastPage;
    const hasPrevPage = page > 1;

    const data = await this.tripRepository.find({
      relations: {
        bus: {
          user: true,
        },
        route: true,
        tickets: {
          user: true,
        },
      },
      order: { departure_time: 'ASC' },
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

  async findOne(id: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id, is_active: true },
      relations: {
        bus: {
          user: true,
          stacks: true,
        },
        route: true,
        tickets: {
          seat: true,
          payment: true,
          user: true,
        },
      },
    });

    if (!trip) {
      throw new NotFoundException(`El viaje con ID ${id} no existe`);
    }

    return trip;
  }

  async search(searchDto: SearchTripsDto, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const { routeId, busId, departureDate, fromDate, toDate, status } =
      searchDto;

    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * take;

    const queryBuilder = this.tripRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.bus', 'bus')
      .leftJoinAndSelect('trip.route', 'route')
      .leftJoinAndSelect('trip.tickets', 'tickets')
      .where('trip.is_active = :active', { active: true });

    // Filtros opcionales
    if (routeId) {
      queryBuilder.andWhere('route.id = :routeId', { routeId });
    }

    if (busId) {
      queryBuilder.andWhere('bus.id = :busId', { busId });
    }

    if (departureDate) {
      const startOfDay = new Date(departureDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(departureDate);
      endOfDay.setHours(23, 59, 59, 999);

      queryBuilder.andWhere(
        'trip.departure_time BETWEEN :startOfDay AND :endOfDay',
        {
          startOfDay,
          endOfDay,
        },
      );
    }

    if (fromDate) {
      queryBuilder.andWhere('trip.departure_time >= :fromDate', { fromDate });
    }

    if (toDate) {
      queryBuilder.andWhere('trip.departure_time <= :toDate', { toDate });
    }

    if (status) {
      queryBuilder.andWhere('trip.status = :status', { status });
    }

    const total = await queryBuilder.getCount();

    const data = await queryBuilder
      .orderBy('trip.departure_time', 'ASC')
      .skip(skip)
      .take(take)
      .getMany();

    const lastPage = Math.ceil(total / take);
    const hasNextPage = page < lastPage;
    const hasPrevPage = page > 1;

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

  async findAvailableTrips(routeId?: string, date?: string) {
    const queryBuilder = this.tripRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.bus', 'bus')
      .leftJoinAndSelect('trip.route', 'route')
      .where('trip.is_active = :active', { active: true })
      .andWhere('trip.status = :status', { status: 'SCHEDULED' })
      .andWhere('trip.departure_time > :now', { now: new Date() })
      .andWhere('trip.available_seats > 0');

    if (routeId) {
      queryBuilder.andWhere('route.id = :routeId', { routeId });
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      queryBuilder.andWhere(
        'trip.departure_time BETWEEN :startOfDay AND :endOfDay',
        {
          startOfDay,
          endOfDay,
        },
      );
    }

    return queryBuilder.orderBy('trip.departure_time', 'ASC').getMany();
  }

  async update(id: string, updateTripDto: UpdateTripDto): Promise<Trip> {
    const { busId, routeId, departure_time, arrival_time, ...tripData } =
      updateTripDto;

    // Verificar que el viaje existe
    const existingTrip = await this.findOne(id);

    // No permitir actualizar viajes en progreso o completados
    if (
      existingTrip.status === TripStatus.IN_PROGRESS ||
      existingTrip.status === TripStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'No se puede actualizar un viaje en progreso o completado',
      );
    }

    const updateData: any = { ...tripData };

    // Validar fechas si se están actualizando
    if (departure_time || arrival_time) {
      const newDeparture = departure_time
        ? new Date(departure_time)
        : existingTrip.departure_time;
      const newArrival = arrival_time
        ? new Date(arrival_time)
        : existingTrip.arrival_time;

      if (newDeparture >= newArrival) {
        throw new BadRequestException(
          'La fecha de llegada debe ser posterior a la fecha de salida',
        );
      }

      updateData.departure_time = newDeparture;
      updateData.arrival_time = newArrival;
    }

    //Validar choque de horarios
    if (updateData.departure_time || updateData.arrival_time || busId) {
      const checkBusId = busId || existingTrip.bus.id;
      const checkDeparture =
        updateData.departure_time || existingTrip.departure_time;
      const checkArrival = updateData.arrival_time || existingTrip.arrival_time;

      const conflictingTrip = await this.tripRepository
        .createQueryBuilder('trip')
        .where('trip.bus.id = :checkBusId', { checkBusId })
        .andWhere('trip.id != :currentTripId', { currentTripId: id })
        .andWhere('trip.is_active = :active', { active: true })
        .andWhere('trip.status != :cancelled', {
          cancelled: TripStatus.CANCELLED,
        })
        .andWhere(
          '(trip.departure_time BETWEEN :start AND :end) OR ' +
            '(trip.arrival_time BETWEEN :start AND :end) OR ' +
            '(trip.departure_time <= :start AND trip.arrival_time >= :end)',
          { start: checkDeparture, end: checkArrival },
        )
        .getOne();

      if (conflictingTrip) {
        throw new BadRequestException(
          'El bus ya tiene un viaje programado que se solapa con estos horarios',
        );
      }
    }
    //Validar si bus tiene ruta
    if (busId || routeId) {
      const newBusId = busId || existingTrip.bus.id;
      const newRouteId = routeId || existingTrip.route.id;

      const route = await this.findRoute(newRouteId);
      const busInRoute = route.buses?.some((b) => b.id === newBusId);

      if (!busInRoute) {
        const bus = await this.findBus(newBusId);
        throw new BadRequestException(
          `El bus ${bus.plate} no está asignado a la ruta ${route.name}`,
        );
      }
    }

    // Actualizar bus si se proporciona
    if (busId) {
      const bus = await this.findBus(busId);
      updateData.bus = bus;
      updateData.available_seats = await this.calculateAvailableSeats(busId);
    }

    //Evitar que cambien de bus si tienen tickets vendidos, invilidando asientos
    if (busId) {
      const confirmedTicketsCount =
        existingTrip.tickets?.filter((t) => t.status === TicketStatus.CONFIRMED)
          .length || 0;

      if (confirmedTicketsCount > 0) {
        throw new BadRequestException(
          `No se puede cambiar el bus de un viaje que tiene ${confirmedTicketsCount} tickets confirmados`,
        );
      }

      const bus = await this.findBus(busId);
      updateData.bus = bus;
      updateData.available_seats = await this.calculateAvailableSeats(busId);
    }
    // Actualizar ruta si se proporciona
    if (routeId) {
      const route = await this.findRoute(routeId);
      updateData.route = route;
    }

    // Verificar que hay algo para actualizar
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No hay datos para actualizar');
    }

    await this.tripRepository.update(id, updateData);

    return this.findOne(id);
  }

  async remove(id: string): Promise<Trip> {
    const trip = await this.findOne(id);

    //No se puede eluminar viajes en progreso
    if (trip.status === TripStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'No se puede eliminar un viaje que está en progreso',
      );
    }
    // No permitir eliminar viajes con tickets confirmados
    const confirmedTicketsCount =
      trip.tickets?.filter((ticket) => ticket.status === 'CONFIRMADO').length ||
      0;

    if (confirmedTicketsCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar un viaje que tiene tickets confirmados',
      );
    }

    // Soft delete
    await this.tripRepository.update(id, { is_active: false });

    return { ...trip, is_active: false };
  }

  async cancelTrip(id: string): Promise<Trip> {
    const trip = await this.findOne(id);

    if (trip.status === TripStatus.CANCELLED) {
      throw new BadRequestException('El viaje ya está cancelado');
    }

    if (trip.status === TripStatus.COMPLETED) {
      throw new BadRequestException('No se puede cancelar un viaje completado');
    }

    // Cancelar todos los tickets activos
    if (trip.tickets && trip.tickets.length > 0) {
      const activeTickets = trip.tickets.filter(
        (t) =>
          t.is_active &&
          (t.status === TicketStatus.CONFIRMED ||
            t.status === TicketStatus.PENDING),
      );

      for (const ticket of activeTickets) {
        await this.ticketRepository.update(ticket.ticket_id, {
          status: TicketStatus.CANCELLED,
        });
      }
    }

    await this.tripRepository.update(id, {
      status: TripStatus.CANCELLED,
    });

    return this.findOne(id);
  }

  async startTrip(id: string): Promise<Trip> {
    const trip = await this.findOne(id);

    if (trip.status !== TripStatus.SCHEDULED) {
      throw new BadRequestException(
        'Solo se pueden iniciar viajes programados',
      );
    }

    await this.tripRepository.update(id, {
      status: TripStatus.IN_PROGRESS,
    });

    return this.findOne(id);
  }

  async completeTrip(id: string): Promise<Trip> {
    const trip = await this.findOne(id);

    if (trip.status !== TripStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Solo se pueden completar viajes en progreso',
      );
    }

    // Desactivar todos los tickets del viaje
    if (trip.tickets && trip.tickets.length > 0) {
      const ticketIds = trip.tickets.map((t) => t.ticket_id);
      await this.ticketRepository.update(
        { ticket_id: In(ticketIds) },
        { is_active: false },
      );

      // Liberar todos los asientos del viaje
      const seatIds = trip.tickets.map((t) => t.seat.id);
      await this.seatRepository.update(
        { id: In(seatIds) },
        { status: 'disponible' },
      );
    }

    await this.tripRepository.update(id, {
      status: TripStatus.COMPLETED,
      is_active: false,
    });

    return this.findTripById(id); // ← Usar el método sin filtro is_active
  }

  async getTripStatistics(id: string) {
    const trip = await this.findOne(id);

    const stats = await this.tripRepository
      .createQueryBuilder('trip')
      .leftJoin('trip.tickets', 'ticket')
      .select([
        'COUNT(ticket.ticket_id) as total_tickets',
        `COUNT(CASE WHEN ticket.status = '${TicketStatus.CONFIRMED}' THEN 1 END) as confirmed_tickets`,
        `COUNT(CASE WHEN ticket.status = '${TicketStatus.PENDING}' THEN 1 END) as pending_tickets`,
        `COUNT(CASE WHEN ticket.status = '${TicketStatus.CANCELLED}' THEN 1 END) as cancelled_tickets`,
        `SUM(CASE WHEN ticket.status = '${TicketStatus.CONFIRMED}' THEN ticket.price ELSE 0 END) as total_revenue`,
      ])
      .where('trip.id = :id', { id })
      .getRawOne();

    return {
      trip,
      statistics: {
        totalTickets: parseInt(stats.total_tickets) || 0,
        confirmedTickets: parseInt(stats.confirmed_tickets) || 0,
        pendingTickets: parseInt(stats.pending_tickets) || 0,
        cancelledTickets: parseInt(stats.cancelled_tickets) || 0,
        availableSeats: trip.available_seats,
        occupancyRate:
          trip.available_seats > 0
            ? (
                ((parseInt(stats.confirmed_tickets) || 0) /
                  (trip.available_seats +
                    (parseInt(stats.confirmed_tickets) || 0))) *
                100
              ).toFixed(2)
            : '0',
        totalRevenue: parseFloat(stats.total_revenue) || 0,
      },
    };
  }

  // Métodos auxiliares privados
  private async findBus(busId: string): Promise<Bus> {
    const bus = await this.busRepository.findOne({
      where: { id: busId, is_active: true },
    });

    if (!bus) {
      throw new NotFoundException(`El bus ${busId} no existe o no está activo`);
    }

    return bus;
  }

  private async findRoute(routeId: string): Promise<Route> {
    const route = await this.routeRepository.findOne({
      where: { id: routeId, is_active: true }, // AGREGAR is_active
      relations: { buses: true }, // AGREGAR relación buses
    });

    if (!route) {
      throw new NotFoundException(`La ruta ${routeId} no existe`);
    }

    return route;
  }

  private async calculateAvailableSeats(busId: string): Promise<number> {
    // Esto depende de cómo tengas estructurado el conteo de asientos en el bus
    // Por ahora asumo que tienes una relación con seats o un campo capacity
    const bus = await this.busRepository.findOne({
      where: { id: busId },
      relations: { stacks: { seats: true } },
    });

    if (!bus || !bus.stacks || bus.stacks.length === 0) {
      return 0;
    }

    // Contar todos los asientos activos de TODOS los stacks del bus
    return bus.stacks.reduce((total, stack) => {
      return (
        total + (stack.seats?.filter((seat) => seat.is_active).length || 0)
      );
    }, 0);
  }

  // Después del método privado calculateAvailableSeats
  async updateAvailableSeats(tripId: string): Promise<void> {
    const trip = await this.tripRepository.findOne({
      where: { id: tripId },
      relations: {
        bus: { stacks: { seats: true } },
        tickets: true,
      },
    });

    if (!trip) {
      throw new NotFoundException(`El viaje ${tripId} no existe`);
    }

    // Contar asientos totales del bus
    const totalSeats =
      trip.bus.stacks?.reduce((total, stack) => {
        return (
          total + (stack.seats?.filter((seat) => seat.is_active).length || 0)
        );
      }, 0) || 0;

    // Contar tickets confirmados
    const confirmedTickets =
      trip.tickets?.filter((ticket) => ticket.status === 'CONFIRMADO').length ||
      0;

    // Calcular disponibles
    const available = totalSeats - confirmedTickets;

    await this.tripRepository.update(tripId, {
      available_seats: Math.max(0, available),
    });
  }
  //////////////////////////////////
  // Método auxiliar privado para buscar viajes sin filtro is_active
  private async findTripById(id: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id },
      relations: {
        bus: {
          user: true,
          stacks: true,
        },
        route: true,
        tickets: {
          seat: true,
          payment: true,
          user: true,
        },
      },
    });

    if (!trip) {
      throw new NotFoundException(`El viaje con ID ${id} no existe`);
    }

    return trip;
  }
}
