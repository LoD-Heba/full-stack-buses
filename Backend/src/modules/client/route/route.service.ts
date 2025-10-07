import { 
  Injectable, 
  NotFoundException, 
  BadRequestException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { SearchRoutesDto } from './dto/search-routes.dto';
import { Route } from './entities/route.entity';
import { City } from '../city/entities/city.entity';
import { Bus } from '../bus/entities/bus.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginatedResponse } from 'src/modules/auth/interfaces/auth.interfaces';

@Injectable()
export class RouteService {
  constructor(
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
  ) {}

  async create(createRouteDto: CreateRouteDto): Promise<Route> {
    const { 
      originCityId, 
      destinationCityId, 
      busIds, 
      name,
      ...routeData 
    } = createRouteDto;

    // Validar que origen y destino son diferentes
    if (originCityId === destinationCityId) {
      throw new BadRequestException(
        'La ciudad de origen y destino no pueden ser la misma'
      );
    }

    // Validar que las ciudades existen
    const originCity = await this.findCity(originCityId);
    const destinationCity = await this.findCity(destinationCityId);

    // Verificar que no existe una ruta igual (mismo origen y destino)
    const existingRoute = await this.routeRepository.findOne({
      where: {
        originCity: { id: originCityId },
        destinationCity: { id: destinationCityId },
        is_active: true
      }
    });

    if (existingRoute) {
      throw new BadRequestException(
        `Ya existe una ruta de ${originCity.name} a ${destinationCity.name}`
      );
    }

    // Validar buses si se proporcionan
    let buses: Bus[] = [];
    if (busIds && busIds.length > 0) {
      buses = await this.findBuses(busIds);
    }

    // Generar nombre automático si no se proporciona
    const routeName = name || `${originCity.name} - ${destinationCity.name}`;

    // Crear la ruta
    const route = this.routeRepository.create({
      ...routeData,
      name: routeName,
      originCity,
      destinationCity,
      buses,
    });

    return this.routeRepository.save(route);
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<Route>> {
    const { page = 1, limit = 10 } = paginationDto;

    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * take;

    const total = await this.routeRepository.count({
      where: { is_active: true },
    });

    const lastPage = Math.ceil(total / take);
    const hasNextPage = page < lastPage;
    const hasPrevPage = page > 1;

    const data = await this.routeRepository.find({
      where: { is_active: true },
      relations: {
        originCity: true,
        destinationCity: true,
        buses: {
          user: true
        },
        trips: true
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

  async findOne(id: string): Promise<Route> {
    const route = await this.routeRepository.findOne({
      where: { id, is_active: true },
      relations: { 
        originCity: true,
        destinationCity: true,
        buses: {
          user: true,
          stacks: {
            seats: true
          }
        },
        trips: {
          tickets: true
        }
      }
    });

    if (!route) {
      throw new NotFoundException(`La ruta con ID ${id} no existe`);
    }
    
    return route;
  }

  async search(searchDto: SearchRoutesDto, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const { originCityId, destinationCityId, searchTerm } = searchDto;

    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * take;

    const queryBuilder = this.routeRepository
      .createQueryBuilder('route')
      .leftJoinAndSelect('route.originCity', 'originCity')
      .leftJoinAndSelect('route.destinationCity', 'destinationCity')
      .leftJoinAndSelect('route.buses', 'buses')
      .where('route.is_active = :active', { active: true });

    // Filtros opcionales
    if (originCityId) {
      queryBuilder.andWhere('originCity.id = :originCityId', { originCityId });
    }

    if (destinationCityId) {
      queryBuilder.andWhere('destinationCity.id = :destinationCityId', { destinationCityId });
    }

    if (searchTerm) {
      queryBuilder.andWhere(
        '(route.name ILIKE :searchTerm OR route.description ILIKE :searchTerm OR originCity.name ILIKE :searchTerm OR destinationCity.name ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` }
      );
    }

    const total = await queryBuilder.getCount();

    const data = await queryBuilder
      .orderBy('route.created_at', 'DESC')
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

  async findPopularRoutes(limit: number = 5) {
    return this.routeRepository
      .createQueryBuilder('route')
      .leftJoinAndSelect('route.originCity', 'originCity')
      .leftJoinAndSelect('route.destinationCity', 'destinationCity')
      .leftJoin('route.trips', 'trips')
      .leftJoin('trips.tickets', 'tickets')
      .select([
        'route',
        'originCity',
        'destinationCity'
      ])
      .addSelect('COUNT(tickets.ticket_id)', 'ticket_count')
      .where('route.is_active = :active', { active: true })
      .groupBy('route.id')
      .addGroupBy('originCity.id')
      .addGroupBy('destinationCity.id')
      .orderBy('ticket_count', 'DESC')
      .limit(limit)
      .getMany();
  }

  async findByCity(cityId: string, type: 'origin' | 'destination' | 'both' = 'both') {
    const queryBuilder = this.routeRepository
      .createQueryBuilder('route')
      .leftJoinAndSelect('route.originCity', 'originCity')
      .leftJoinAndSelect('route.destinationCity', 'destinationCity')
      .where('route.is_active = :active', { active: true });

    if (type === 'origin') {
      queryBuilder.andWhere('originCity.id = :cityId', { cityId });
    } else if (type === 'destination') {
      queryBuilder.andWhere('destinationCity.id = :cityId', { cityId });
    } else {
      queryBuilder.andWhere(
        '(originCity.id = :cityId OR destinationCity.id = :cityId)',
        { cityId }
      );
    }

    return queryBuilder
      .orderBy('route.name', 'ASC')
      .getMany();
  }

  async update(id: string, updateRouteDto: UpdateRouteDto): Promise<Route> {
    const { 
      originCityId, 
      destinationCityId, 
      busIds, 
      ...routeData 
    } = updateRouteDto;

    // Verificar que la ruta existe
    const existingRoute = await this.findOne(id);

    // Validar que origen y destino son diferentes si se están actualizando
    if (originCityId && destinationCityId && originCityId === destinationCityId) {
      throw new BadRequestException(
        'La ciudad de origen y destino no pueden ser la misma'
      );
    }

    // Verificar si hay viajes programados o en progreso
    const activeTrips = existingRoute.trips?.filter(
      trip => trip.status === 'SCHEDULED' || trip.status === 'IN_PROGRESS'
    ) || [];

    if (activeTrips.length > 0 && (originCityId || destinationCityId)) {
      throw new BadRequestException(
        'No se pueden cambiar las ciudades de una ruta que tiene viajes programados o en progreso'
      );
    }

    const updateData: any = { ...routeData };

    // Actualizar ciudad de origen si se proporciona
    if (originCityId) {
      const originCity = await this.findCity(originCityId);
      updateData.originCity = originCity;
    }

    // Actualizar ciudad de destino si se proporciona
    if (destinationCityId) {
      const destinationCity = await this.findCity(destinationCityId);
      updateData.destinationCity = destinationCity;
    }

    // Actualizar nombre automáticamente si se cambian las ciudades
    if (originCityId || destinationCityId) {
      const origin = originCityId 
        ? await this.findCity(originCityId) 
        : existingRoute.originCity;
      const destination = destinationCityId 
        ? await this.findCity(destinationCityId) 
        : existingRoute.destinationCity;
      
      updateData.name = updateRouteDto.name || `${origin.name} - ${destination.name}`;
    }

    // Verificar que hay algo para actualizar
    const hasDataToUpdate = Object.keys(updateData).length > 0;
    const hasBusesToUpdate = busIds !== undefined;

    if (!hasDataToUpdate && !hasBusesToUpdate) {
      throw new BadRequestException('No hay datos para actualizar');
    }

    // Actualizar campos básicos si existen
    if (hasDataToUpdate) {
      await this.routeRepository.update(id, updateData);
    }

    // Actualizar buses si se proporcionan
    if (hasBusesToUpdate) {
      const route = await this.routeRepository.findOne({
        where: { id },
        relations: { buses: true }
      });

      if (busIds && busIds.length > 0) {
        const buses = await this.findBuses(busIds);
        route!.buses = buses;
      } else {
        route!.buses = [];
      }

      await this.routeRepository.save(route!); 
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<Route> {
    const route = await this.findOne(id);

    // Verificar si tiene viajes programados o en progreso
    const activeTrips = route.trips?.filter(
      trip => trip.status === 'SCHEDULED' || trip.status === 'IN_PROGRESS'
    ) || [];

    if (activeTrips.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar una ruta que tiene viajes programados o en progreso'
      );
    }

    // Soft delete
    await this.routeRepository.update(id, { is_active: false });

    return { ...route, is_active: false };
  }

  async assignBus(routeId: string, busId: string): Promise<Route> {
    const route = await this.routeRepository.findOne({
      where: { id: routeId },
      relations: { buses: true }
    });

    if (!route) {
      throw new NotFoundException(`La ruta ${routeId} no existe`);
    }

    const bus = await this.findBus(busId);

    // Verificar si el bus ya está asignado
    const busAlreadyAssigned = route.buses.some(b => b.id === busId);
    if (busAlreadyAssigned) {
      throw new BadRequestException('El bus ya está asignado a esta ruta');
    }

    route.buses.push(bus);
    await this.routeRepository.save(route);

    return this.findOne(routeId);
  }

  async removeBus(routeId: string, busId: string): Promise<Route> {
    const route = await this.routeRepository.findOne({
      where: { id: routeId },
      relations: { buses: true }
    });

    if (!route) {
      throw new NotFoundException(`La ruta ${routeId} no existe`);
    }

    route.buses = route.buses.filter(bus => bus.id !== busId);
    await this.routeRepository.save(route);

    return this.findOne(routeId);
  }

  async getRouteStatistics(id: string) {
    const route = await this.findOne(id);

    const stats = await this.routeRepository
      .createQueryBuilder('route')
      .leftJoin('route.trips', 'trips')
      .leftJoin('trips.tickets', 'tickets')
      .select([
        'COUNT(DISTINCT trips.id) as total_trips',
        'COUNT(DISTINCT CASE WHEN trips.status = \'SCHEDULED\' THEN trips.id END) as scheduled_trips',
        'COUNT(DISTINCT CASE WHEN trips.status = \'COMPLETED\' THEN trips.id END) as completed_trips',
        'COUNT(tickets.ticket_id) as total_tickets',
        'SUM(CASE WHEN tickets.status = \'CONFIRMED\' THEN tickets.price ELSE 0 END) as total_revenue'
      ])
      .where('route.id = :id', { id })
      .getRawOne();

    return {
      route,
      statistics: {
        totalTrips: parseInt(stats.total_trips) || 0,
        scheduledTrips: parseInt(stats.scheduled_trips) || 0,
        completedTrips: parseInt(stats.completed_trips) || 0,
        totalTickets: parseInt(stats.total_tickets) || 0,
        totalRevenue: parseFloat(stats.total_revenue) || 0,
        assignedBuses: route.buses?.length || 0
      }
    };
  }

  // Métodos auxiliares privados
  private async findCity(cityId: string): Promise<City> {
    const city = await this.cityRepository.findOne({
      where: { id: cityId }
    });
    
    if (!city) {
      throw new NotFoundException(`La ciudad ${cityId} no existe`);
    }
    
    return city;
  }

  private async findBus(busId: string): Promise<Bus> {
    const bus = await this.busRepository.findOne({
      where: { id: busId, is_active: true }
    });
    
    if (!bus) {
      throw new NotFoundException(`El bus ${busId} no existe o no está activo`);
    }
    
    return bus;
  }

  private async findBuses(busIds: string[]): Promise<Bus[]> {
    const buses = await this.busRepository.find({
      where: { id: In(busIds), is_active: true }
    });
    
    if (buses.length !== busIds.length) {
      throw new NotFoundException('Algunos buses no existen o no están activos');
    }
    
    return buses;
  }
}