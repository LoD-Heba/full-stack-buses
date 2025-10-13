import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
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

    // Validar que el bus existe y está activo
    const bus = await this.findBus(busId);

    // Validar que la ruta existe
    const route = await this.findRoute(routeId);

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
      where: { is_active: true },
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

    await this.tripRepository.update(id, {
      status: TripStatus.COMPLETED,
    });

    return this.findOne(id);
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

    if (!bus || !bus.stacks) {
      return 0;
    }

    // Contar todos los asientos activos del bus
    return bus.stacks.seats?.filter((seat) => seat.is_active).length || 0;
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
      trip.bus.stacks?.seats?.filter((seat) => seat.is_active).length || 0;

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
}
