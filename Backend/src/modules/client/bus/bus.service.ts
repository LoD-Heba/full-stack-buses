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

@Injectable()
export class BusService {
  constructor(
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(SeatStack)
    private readonly seatStackRepository: Repository<SeatStack>,

    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
  ) {}

  async create(createBusDto: CreateBusDto): Promise<Bus> {
    const { userId, stackId, ...busData } = createBusDto;

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

    // Validar stack si se proporciona
    let stacks: SeatStack | undefined;
    if (stackId) {
      stacks = await this.findSeatStack(stackId);

      // Verificar que el stack no esté ya asignado
      const stackAlreadyUsed = await this.busRepository.findOne({
        where: { stacks: { id: stackId } },
      });
      if (stackAlreadyUsed) {
        throw new BadRequestException(
          'El stack de asientos ya está asignado a otro bus',
        );
      }
    }

    // Crear el bus
    const newBus = this.busRepository.create({
      ...busData,
      plate: busData.plate.toUpperCase(),
      user,
      stacks,
    });

    const savedBus = await this.busRepository.save(newBus);

    // Actualizar la capacidad basada en el stack si existe
    if (stacks) {
      await this.updateBusCapacity(savedBus.id);
    }

    return this.findOne(savedBus.id);
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<Bus>> {
    const { page = 1, limit = 10 } = paginationDto;

    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * take;

    const total = await this.busRepository.count({
      where: { is_active: true },
    });

    const lastPage = Math.ceil(total / take);
    const hasNextPage = page < lastPage;
    const hasPrevPage = page > 1;

    const data = await this.busRepository.find({
      where: { is_active: true },
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

    return bus;
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

    const data = await queryBuilder
      .orderBy('bus.created_at', 'DESC')
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

  async findByUser(userId: string): Promise<Bus[]> {
    return this.busRepository.find({
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
  }

  async findAvailable(): Promise<Bus[]> {
    return this.busRepository.find({
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
  }

  async update(id: string, updateBusDto: UpdateBusDto): Promise<Bus> {
    const { userId, stackId, ...busData } = updateBusDto;

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

    // Actualizar stack si se proporciona
    if (stackId !== undefined) {
      if (stackId) {
        const stacks = await this.findSeatStack(stackId);

        // Verificar que el stack no esté ya asignado a otro bus
        const stackAlreadyUsed = await this.busRepository.findOne({
          where: {
            stacks: { id: stackId },
            id: Not(id),
          },
        });
        if (stackAlreadyUsed) {
          throw new BadRequestException(
            'El stack de asientos ya está asignado a otro bus',
          );
        }

        updateData.stacks = stacks;
      } else {
        updateData.stacks = null;
      }
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

    // Actualizar capacidad si se cambió el stack
    if (stackId !== undefined) {
      await this.updateBusCapacity(id);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<Bus> {
    const bus = await this.findOne(id);

    // Verificar si tiene viajes programados o en progreso
    const activeTrips =
      bus.trips?.filter(
        (trip) =>
          trip.status === TripStatus.SCHEDULED ||
          trip.status === TripStatus.IN_PROGRESS, ///////////////
      ) || [];

    if (activeTrips.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar un bus que tiene viajes programados o en progreso',
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
    const bus = await this.findOne(id);

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
      // 
      const activeSeatsCount =
        bus.stacks.seats?.filter((s) => s.is_active).length || 0;

      // Validación de capacidad mínima
      if (activeSeatsCount < 15) {
        throw new BadRequestException(
          `El bus debe tener al menos 15 asientos activos (actual: ${activeSeatsCount})`,
        );
      }
    }
    const activeSeatsCount =
      bus.stacks.seats?.filter((s) => s.is_active).length || 0;
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

    const seatCount =
      bus.stacks?.seats?.filter((seat) => seat.is_active).length || 0;

    return {
      bus,
      statistics: {
        totalTrips: parseInt(stats.total_trips) || 0,
        completedTrips: parseInt(stats.completed_trips) || 0,
        totalTickets: parseInt(stats.total_tickets) || 0,
        totalRevenue: parseFloat(stats.total_revenue) || 0,
        seatCount,
        assignedRoutes: bus.routes?.length || 0,
        utilizationRate:
          bus.capacity > 0
            ? (
                ((parseInt(stats.total_tickets) || 0) / bus.capacity) *
                100
              ).toFixed(2)
            : '0',
      },
    };
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

  private async findSeatStack(stackId: string): Promise<SeatStack> {
    const seatStack = await this.seatStackRepository.findOne({
      where: { id: stackId },
      relations: { seats: true },
    });

    if (!seatStack) {
      throw new NotFoundException(`El stack de asientos ${stackId} no existe`);
    }

    return seatStack;
  }

  private async updateBusCapacity(busId: string): Promise<void> {
    const bus = await this.busRepository.findOne({
      where: { id: busId },
      relations: { stacks: { seats: true } },
    });

    if (bus && bus.stacks) {
      const activeSeats =
        bus.stacks.seats?.filter((seat) => seat.is_active).length || 0;
      await this.busRepository.update(busId, { capacity: activeSeats });
    }
  }

  async updateImageUrl(id: string, imageUrl: string): Promise<Bus> {
    const bus = await this.findOne(id);

    await this.busRepository.update(id, { image_url: imageUrl });

    return this.findOne(id);
  }
}
