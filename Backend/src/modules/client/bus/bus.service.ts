import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, Not } from 'typeorm';
import { CreateBusDto, BusStatus } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { SearchBusDto } from './dto/search-bus.dto';
import { Bus } from './entities/bus.entity';
import { User } from 'src/modules/admin/user/entities/user.entity';
import { SeatStack } from '../seat-stacks/entities/seat-stack.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginatedResponse } from 'src/modules/auth/interfaces/auth.interfaces';
import { TripStatus, TicketStatus } from 'src/common/enums/status.enum';
import { Route } from '../route/entities/route.entity';
import { Trip } from '../trip/entities/trip.entity';
import { ConfigureBusLayoutDto } from './dto/configure-layout.dto';
import { Seat } from '../seat/entities/seat.entity';
import { BusCapacityHelper } from './bus-capacity.helper';

@Injectable()
export class BusService {
  private readonly capacityHelper: BusCapacityHelper;
  constructor(
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(SeatStack)
    private readonly seatStackRepository: Repository<SeatStack>,

    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,

    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,

    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
  ) {
    this.capacityHelper = new BusCapacityHelper(
      this.busRepository,
      this.seatRepository,
    );
  }

  async create(createBusDto: CreateBusDto): Promise<Bus> {
    const { userId, ...busData } = createBusDto;

    // Validar que el usuario existe y está activo
    const user = await this.findUser(userId);

    // Verificar placa única (case-insensitive)
    const existsPlate = await this.busRepository.findOne({
      where: { plate: createBusDto.plate.toUpperCase() },
    });
    if (existsPlate) {
      throw new BadRequestException(
        `El bus con placa ${createBusDto.plate} ya existe`,
      );
    }

    // Crear el bus
    const newBus = this.busRepository.create({
      ...busData,
      plate: busData.plate.toUpperCase(),
      floors: busData.floors || 1,
      user,
    });

    const savedBus = await this.busRepository.save(newBus);

    return this.findOne(savedBus.id);
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<Bus>> {
    const { page = 1, limit = 10 } = paginationDto;
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * take;

    const total = await this.busRepository.count();
    const lastPage = Math.ceil(total / take);

    let buses = await this.busRepository.find({
      relations: {
        user: true,
        stacks: {
          seats: true,
        },
        routes: true,
        trips: true,
      },
      order: { created_at: 'DESC' },
      skip,
      take,
    });

    // ✨ Enriquecer con capacidad
    const busesWithCapacity =
      await this.capacityHelper.enrichBusesWithCapacity(buses);

    return {
      data: busesWithCapacity as any[],
      meta: {
        total,
        page,
        lastPage,
        limit: take,
        hasNextPage: page < lastPage,
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<Bus> {
    const bus = await this.busRepository.findOne({
      where: { id, is_active: true },
      relations: {
        user: true,
        stacks: {
          seats: true,
        },
        routes: true,
        trips: {
          route: true,
          tickets: true,
        },
      },
    });

    if (!bus) {
      throw new NotFoundException(`El bus con ID ${id} no existe`);
    }
    const capacity = await this.capacityHelper.calculateBusCapacity(id);
    return { ...bus, capacity } as any;
  }

  async search(searchDto: SearchBusDto, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const { userId, service_type, status, searchTerm } = searchDto;

    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * take;

    const queryBuilder = this.busRepository
      .createQueryBuilder('bus')
      .leftJoinAndSelect('bus.user', 'user')
      .leftJoinAndSelect('bus.stacks', 'stacks')
      .leftJoinAndSelect('bus.routes', 'routes')
      .where('bus.is_active = :active', { active: true });

    // Filtros opcionales
    if (userId) {
      queryBuilder.andWhere('user.id = :userId', { userId });
    }

    if (service_type) {
      queryBuilder.andWhere('bus.service_type = :service_type', {
        service_type,
      });
    }

    if (status) {
      queryBuilder.andWhere('bus.status = :status', { status });
    }

    if (searchTerm) {
      queryBuilder.andWhere(
        '(bus.plate ILIKE :searchTerm OR bus.model ILIKE :searchTerm OR bus.amenities ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` },
      );
    }

    const total = await queryBuilder.getCount();

    let data = await queryBuilder
      .orderBy('bus.created_at', 'DESC')
      .skip(skip)
      .take(take)
      .getMany();

    data = await this.capacityHelper.enrichBusesWithCapacity(data);

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

  async findByUser(userId: string): Promise<any[]> {
    let buses = await this.busRepository.find({
      where: {
        user: { id: userId },
        is_active: true,
      },
      relations: {
        stacks: {
          seats: true,
        },
        routes: true,
      },
      order: { created_at: 'DESC' },
    });

    // ✨ Enriquecer con capacidad
    return await this.capacityHelper.enrichBusesWithCapacity(buses);
  }

  async findAvailable(): Promise<any[]> {
    let buses = await this.busRepository.find({
      where: {
        is_active: true,
        status: BusStatus.DISPONIBLE,
      },
      relations: {
        user: true,
        stacks: {
          seats: true,
        },
      },
      order: { model: 'ASC' },
    });

    // ✨ Solo retornar buses con al menos 1 asiento
    const busesWithCapacity =
      await this.capacityHelper.enrichBusesWithCapacity(buses);
    return busesWithCapacity.filter((bus) => bus.capacity > 0);
  }

  async update(id: string, updateBusDto: UpdateBusDto): Promise<Bus> {
    const { userId, ...busData } = updateBusDto;

    // Verificar que el bus existe
    const existingBus = await this.findOne(id);

    // Verificar si el bus está en uso y no permitir ciertos cambios
    if (existingBus.status === BusStatus.EN_USO) {
      const restrictedFields = ['plate', 'model', 'service_type'];
      const hasRestrictedChanges = restrictedFields.some(
        (field) => busData[field] !== undefined,
      );

      if (hasRestrictedChanges) {
        throw new BadRequestException(
          'No se pueden modificar datos básicos de un bus en uso',
        );
      }
    }

    const updateData: any = { ...busData };

    // Normalizar placa si se está actualizando
    if (busData.plate) {
      updateData.plate = busData.plate.toUpperCase();

      // Verificar placa única
      if (updateData.plate !== existingBus.plate) {
        const existsPlate = await this.busRepository.findOne({
          where: { plate: updateData.plate },
        });
        if (existsPlate) {
          throw new BadRequestException(
            `El bus con placa ${updateData.plate} ya existe`,
          );
        }
      }
    }

    // Actualizar usuario si se proporciona
    if (userId) {
      const user = await this.findUser(userId);
      updateData.user = user;
    }

    

    // Verificar que hay algo para actualizar
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No hay datos para actualizar');
    }

    // Actualizar el bus
    await this.busRepository.save({
      id,
      ...updateData,
    });

    return this.findOne(id);
  }

  async remove(id: string): Promise<Bus> {
  const bus = await this.findOne(id);

  // ✨ NUEVA VALIDACIÓN: Verificar viajes programados O en progreso
  const activeTrips =
    bus.trips?.filter(
      (trip) =>
        trip.status === TripStatus.SCHEDULED ||
        trip.status === TripStatus.IN_PROGRESS,
    ) || [];

  if (activeTrips.length > 0) {
    const scheduledCount = activeTrips.filter(
      (t) => t.status === TripStatus.SCHEDULED
    ).length;
    const inProgressCount = activeTrips.filter(
      (t) => t.status === TripStatus.IN_PROGRESS
    ).length;

    const messages: string[] = [];
    if (scheduledCount > 0) {
      messages.push(`${scheduledCount} programado(s)`);
    }
    if (inProgressCount > 0) {
      messages.push(`${inProgressCount} en progreso`);
    }

    throw new BadRequestException(
      `No se puede desactivar un bus que tiene viajes activos: ${messages.join(' y ')}`,
    );
  }

  // Soft delete
  await this.busRepository.update(id, {
    is_active: false,
    status: BusStatus.FUERA_DE_SERVICIO,
  });

  return { ...bus, is_active: false };
}

  async hardDelete(id: string): Promise<void> {
    const bus = await this.busRepository.findOne({
      where: { id, is_active: false },
    });

    if (!bus) {
      throw new NotFoundException(
        `El bus con ID ${id} no existe o ya ha sido eliminado`,
      );
    }

    // Verificar que NO tenga NINGÚN viaje (ni completados)
    if (bus.trips && bus.trips.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar permanentemente un bus con historial de viajes',
      );
    }

    // Verificar que NO tenga tickets relacionados
    const hasTickets = await this.busRepository
      .createQueryBuilder('bus')
      .leftJoin('bus.trips', 'trips')
      .leftJoin('trips.tickets', 'tickets')
      .where('bus.id = :id', { id })
      .andWhere('tickets.ticket_id IS NOT NULL')
      .getCount();

    if (hasTickets > 0) {
      throw new BadRequestException(
        'No se puede eliminar un bus con historial de tickets',
      );
    }

    // Desvincular de rutas (relación many-to-many)
    const routes = await this.routeRepository.find({
      where: { buses: { id } },
      relations: ['buses'],
    });

    for (const route of routes) {
      route.buses = route.buses.filter((b) => b.id !== id);
      await this.routeRepository.save(route);
    }

    // Eliminar permanentemente
    await this.busRepository.remove(bus);
  }

  async changeStatus(id: string, status: BusStatus): Promise<Bus> {
    const bus = await this.findOne(id);

    // Validaciones según el estado
    if (status === BusStatus.EN_USO) {
      // Validar antiguedad de bus
      const currentYear = new Date().getFullYear();
      const busAge = currentYear - (bus.year || currentYear);
      if (busAge > 15) {
        throw new BadRequestException(
          `El bus tiene ${busAge} años de antigüedad. Solo se permiten buses con menos de 15 años en servicio`,
        );
      }
    }

    const activeSeatsCount = bus.stacks.reduce((total, stack) => {
      return total + (stack.seats?.filter((s) => s.is_active).length || 0);
    }, 0);
    if (activeSeatsCount === 0) {
      throw new BadRequestException(
        'El bus debe tener al menos un asiento activo antes de ponerse en uso',
      );
    }
    if (status === BusStatus.DISPONIBLE && bus.status === BusStatus.EN_USO) {
      // Verificar que no tenga viajes en progreso
      const activeTrips =
        bus.trips?.filter((trip) => trip.status === 'IN_PROGRESS') || [];

      if (activeTrips.length > 0) {
        throw new BadRequestException(
          'No se puede cambiar a disponible un bus que tiene viajes en progreso',
        );
      }
    }

    await this.busRepository.update(id, { status });

    return this.findOne(id);
  }

  async getBusStatistics(id: string) {
    const bus = await this.findOne(id);

    const stats = await this.busRepository
      .createQueryBuilder('bus')
      .leftJoin('bus.trips', 'trips')
      .leftJoin('trips.tickets', 'tickets')
      .select([
        'COUNT(DISTINCT trips.id) as total_trips',
        `COUNT(DISTINCT CASE WHEN trips.status = '${TripStatus.COMPLETED}' THEN trips.id END) as completed_trips`,
        'COUNT(tickets.ticket_id) as total_tickets',
        "SUM(CASE WHEN tickets.status = 'CONFIRMADO' THEN tickets.price ELSE 0 END) as total_revenue",
      ])
      .where('bus.id = :id', { id })
      .getRawOne();

    return {
      bus,
      statistics: {
        totalTrips: parseInt(stats.total_trips) || 0,
        completedTrips: parseInt(stats.completed_trips) || 0,
        totalTickets: parseInt(stats.total_tickets) || 0,
        totalRevenue: parseFloat(stats.total_revenue) || 0,
        assignedRoutes: bus.routes?.length || 0,
      },
    };
  }

  async getBusLayout(id: string) {
    const bus = await this.busRepository.findOne({
      where: { id, is_active: true },
      relations: {
        stacks: {
          seats: true,
        },
      },
    });

    if (!bus) {
      throw new NotFoundException(`El bus con ID ${id} no existe`);
    }

    // Si el bus no tiene stacks, retornar estructura vacía
    if (!bus.stacks || bus.stacks.length === 0) {
      return {
        bus_id: bus.id,
        plate: bus.plate,
        model: bus.model,
        service_type: bus.service_type,
        floors: bus.floors || 1,
        decks: [],
      };
    }

    // Agrupar asientos por deck (piso)
    const deckLayouts = bus.stacks.map((stack) => {
      const layout =
        stack.seats
          ?.filter((seat) => seat.is_active)
          .map((seat) => ({
            id: seat.id,
            seat_code: seat.seat_code,
            seat_number: seat.seat_number,
            type: seat.type,
            position_x: seat.position_x || 0,
            position_y: seat.position_y || 0,
            visual_type: seat.visual_type || 'seat',
            rotation: seat.rotation || 0,
            deck: seat.deck || stack.floor_number || 1,
            meta: seat.meta || {},
          })) || [];

      return {
        deck: stack.floor_number || 1,
        stack_id: stack.id,
        stack_name: stack.name,
        layout: layout.sort((a, b) => {
          // Ordenar por position_y primero, luego position_x
          if (a.position_y !== b.position_y) {
            return a.position_y - b.position_y;
          }
          return a.position_x - b.position_x;
        }),
      };
    });

    return {
      bus_id: bus.id,
      plate: bus.plate,
      model: bus.model,
      service_type: bus.service_type,
      floors: bus.floors || 1,
      image_url: bus.image_url,
      amenities: bus.amenities,
      decks: deckLayouts.sort((a, b) => a.deck - b.deck),
    };
  }
  async getBusLayoutForTrip(busId: string, tripId: string) {
    const layout = await this.getBusLayout(busId);

    // Obtener tickets confirmados del viaje
    const trip = await this.tripRepository.findOne({
      where: { id: tripId },
      relations: { tickets: { seat: true } },
    });

    if (!trip) {
      throw new NotFoundException(`El viaje ${tripId} no existe`);
    }

    // Mapear asientos ocupados
    const seatsWithStatus = await this.seatRepository
      .createQueryBuilder('seat')
      .leftJoin('seat.tickets', 'ticket')
      .leftJoin('ticket.trip', 'trip')
      .where('trip.id = :tripId', { tripId })
      .andWhere('seat.stacks.bus_id = :busId', { busId })
      .select([
        'seat.id',
        'seat.seat_code',
        'seat.status',
        'ticket.status as ticket_status',
      ])
      .getRawMany();

    const occupiedSeats = seatsWithStatus
      .filter((s) => s.status === 'ocupado' || s.status === 'reservado')
      .map((s) => s.seat_code);

    return {
      ...layout,
      trip_id: tripId,
      occupied_seats: occupiedSeats,
      available_seats: trip.available_seats,
    };
  }

  async configureLayout(busId: string, configDto: ConfigureBusLayoutDto) {
    return await this.busRepository.manager.transaction(async (manager) => {
      // Verificar que el bus existe
      const bus = await manager.findOne(Bus, {
        where: { id: busId, is_active: true },
        relations: { stacks: { seats: true }, trips: true },
      });

      if (!bus) {
        throw new NotFoundException(`El bus ${busId} no existe`);
      }

      // Validar que no tenga viajes activos
      const activeTrips =
        bus.trips?.filter(
          (trip) =>
            trip.status === TripStatus.SCHEDULED ||
            trip.status === TripStatus.IN_PROGRESS,
        ) || [];

      if (activeTrips.length > 0) {
        throw new BadRequestException(
          `No se puede reconfigurar un bus con ${activeTrips.length} viajes activos`,
        );
      }

      // Eliminar stacks y asientos existentes
      if (bus.stacks && bus.stacks.length > 0) {
        for (const stack of bus.stacks) {
          if (stack.seats && stack.seats.length > 0) {
            await manager.remove(Seat, stack.seats);
          }
          await manager.remove(SeatStack, stack);
        }
      }

      // Crear nuevos stacks y asientos
      const createdStacks: SeatStack[] = [];

      for (const deckConfig of configDto.decks) {
        // Crear stack
        const newStack = manager.create(SeatStack, {
          name: deckConfig.stack_name,
          description: deckConfig.description,
          floor_number: deckConfig.floor_number,
          bus: bus,
        });

        const savedStack = await manager.save(SeatStack, newStack);

        // Crear asientos del stack
        const seats: Seat[] = [];
        for (const seatData of deckConfig.seats) {
          const seat = manager.create(Seat, {
            seat_code: seatData.seat_code.toUpperCase(),
            ...(seatData.visual_type === 'seat' &&
              seatData.seat_number && {
                seat_number: seatData.seat_number,
              }),
            deck: deckConfig.floor_number,
            type: seatData.type,
            position_x: seatData.position_x,
            position_y: seatData.position_y,
            visual_type: seatData.visual_type || 'seat',
            rotation: seatData.rotation || 0,
            meta: seatData.meta || {},
            is_active: true,
            stacks: savedStack,
          });
          seats.push(seat);
        }

        await manager.save(Seat, seats);
        createdStacks.push(savedStack);
      }

      return this.findOne(busId);
    });
  }

  // Métodos auxiliares privados
  private async findUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
      relations: ['roles', 'profile'], // traemos la relación Role
    });

    if (!user) {
      throw new NotFoundException(`El usuario no ha llenado su formulario`);
    }

    // Validar rol
    if (user.profile === null && user.roles.name !== 'empleado') {
      throw new ForbiddenException(`El usuario no tiene permisos suficientes`);
    }

    return user;
  }

  async updateImageUrl(id: string, imageUrl: string): Promise<Bus> {
    const bus = await this.findOne(id);
    await this.busRepository.update(id, { image_url: imageUrl });
    return this.findOne(id);
  }
}
