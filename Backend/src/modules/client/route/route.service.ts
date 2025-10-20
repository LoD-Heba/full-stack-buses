import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { Route } from './entities/route.entity';
import { City } from '../city/entities/city.entity';
import { Bus } from '../bus/entities/bus.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginatedResponse } from 'src/modules/auth/interfaces/auth.interfaces';
import { TripStatus } from 'src/common/enums/status.enum';
import { BusStatus } from '../bus/dto/create-bus.dto';

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
    const { originCityId, destinationCityId, busIds, name, ...routeData } =
      createRouteDto;

    // Validar que origen y destino son diferentes
    if (originCityId === destinationCityId) {
      throw new BadRequestException(
        'La ciudad de origen y destino no pueden ser la misma',
      );
    }

    // Validar que las ciudades existen y están activas
    const originCity = await this.findCity(originCityId);
    const destinationCity = await this.findCity(destinationCityId);

    // Verificar que no existe una ruta igual (mismo origen y destino)
    const existingRoute = await this.routeRepository.findOne({
      where: {
        originCity: { id: originCityId },
        destinationCity: { id: destinationCityId },
        is_active: true,
      },
    });

    if (existingRoute) {
      throw new BadRequestException(
        `Ya existe una ruta de ${originCity.city} a ${destinationCity.city}`,
      );
    }

    // Validar buses si se proporcionan
    let buses: Bus[] = [];
    if (busIds && busIds.length > 0) {
      buses = await this.findBuses(busIds);
    }

    // Generar nombre automático si no se proporciona
    const routeName = name || `${originCity.city} - ${destinationCity.city}`;

    // Crear la ruta
    const route = this.routeRepository.create({
      ...routeData,
      name: routeName,
      originCity,
      destinationCity,
      buses,
    });

    // Validar coherencia entre distancia y duración
    if (createRouteDto.distance_km && createRouteDto.approx_duration) {
      const [hours, minutes] = createRouteDto.approx_duration
        .split(':')
        .map(Number);
      const totalHours = hours + minutes / 60;
      const avgSpeed = createRouteDto.distance_km / totalHours;

      if (avgSpeed < 20 || avgSpeed > 100) {
        throw new BadRequestException(
          `La duración no es coherente con la distancia. Velocidad promedio: ${avgSpeed.toFixed(1)} km/h (debe estar entre 20-100 km/h)`,
        );
      }
    }

    return this.routeRepository.save(route);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Route>> {
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
          user: true,
        },
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

  async findOne(id: string, includeInactive = false): Promise<Route> {
    const where = includeInactive ? { id } : { id, is_active: true };

    const route = await this.routeRepository.findOne({
      where,
      relations: {
        originCity: true,
        destinationCity: true,
        buses: {
          user: true,
          stacks: {
            seats: true,
          },
        },
        trips: {
          tickets: true,
        },
      },
    });

    if (!route) {
      throw new NotFoundException(`La ruta con ID ${id} no existe`);
    }

    return route;
  }

  async findByCity(
    cityId: string,
    type: 'origin' | 'destination' | 'both' = 'both',
  ) {
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
        { cityId },
      );
    }

    return queryBuilder.orderBy('route.name', 'ASC').getMany();
  }

  async update(id: string, updateRouteDto: UpdateRouteDto): Promise<Route> {
    const { originCityId, destinationCityId, busIds, ...routeData } =
      updateRouteDto;

    // Verificar que la ruta existe
    const existingRoute = await this.findOne(id);

    // Validar que origen y destino son diferentes si se están actualizando
    if (
      originCityId &&
      destinationCityId &&
      originCityId === destinationCityId
    ) {
      throw new BadRequestException(
        'La ciudad de origen y destino no pueden ser la misma',
      );
    }

    // Verificar si hay viajes programados o en progreso
    const activeTrips =
      existingRoute.trips?.filter(
        (trip) =>
          trip.status === TripStatus.SCHEDULED ||
          trip.status === TripStatus.IN_PROGRESS,
      ) || [];

    if (activeTrips.length > 0 && (originCityId || destinationCityId)) {
      throw new BadRequestException(
        'No se pueden cambiar las ciudades de una ruta que tiene viajes programados o en progreso',
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

      updateData.name =
        updateRouteDto.name || `${origin.city} - ${destination.city}`;
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
        relations: { buses: true },
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

  /**
   * Soft delete - marca como inactiva
   * La ruta sigue existiendo pero no aparece en listados normales
   */
  async softDelete(id: string) {
    const route = await this.findOne(id);

    // Verificar si hay viajes activos
    const activeTrips = route.trips?.filter(
      (trip) =>
        trip.status === TripStatus.SCHEDULED ||
        trip.status === TripStatus.IN_PROGRESS,
    ) || [];

    if (activeTrips.length > 0) {
      throw new BadRequestException(
        `No puedes desactivar esta ruta porque tiene ${activeTrips.length} viaje(s) activo(s)`,
      );
    }

    await this.routeRepository.update(id, { is_active: false });
    return { message: 'Ruta desactivada correctamente' };
  }

  /**
   * Hard delete - elimina completamente de la base de datos
   * Solo funciona si no hay viajes asociados
   */
  async hardDelete(id: string) {
    const route = await this.findOne(id, true); // Permitir buscar inactivas

    // Verificar si hay viajes (activos o inactivos) asociados
    const totalTrips = route.trips?.length || 0;

    if (totalTrips > 0) {
      throw new BadRequestException(
        `No puedes eliminar esta ruta porque tiene ${totalTrips} viaje(s) asociado(s). Primero elimina o cancela los viajes.`,
      );
    }

    // Limpiar buses antes de eliminar
    route.buses = [];
    await this.routeRepository.save(route);

    await this.routeRepository.remove(route);
    return { message: 'Ruta eliminada permanentemente' };
  }

  /**
   * Obtener rutas inactivas para administración
   */
  async findInactive(paginationDto?: PaginationDto) {
    if (!paginationDto) {
      return await this.routeRepository.find({
        where: { is_active: false },
        order: { updated_at: 'DESC' },
        relations: {
          originCity: true,
          destinationCity: true,
          buses: true,
          trips: true,
        },
      });
    }

    const { page = 1, limit = 10 } = paginationDto;
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * take;

    const total = await this.routeRepository.count({
      where: { is_active: false },
    });

    const lastPage = Math.ceil(total / take);

    const data = await this.routeRepository.find({
      where: { is_active: false },
      order: { updated_at: 'DESC' },
      relations: {
        originCity: true,
        destinationCity: true,
        buses: true,
        trips: true,
      },
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
        hasNextPage: page < lastPage,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Reactivar una ruta inactiva
   */
  async reactivate(id: string) {
    const route = await this.findOne(id, true);

    if (route.is_active) {
      throw new BadRequestException('Esta ruta ya está activa');
    }

    await this.routeRepository.update(id, { is_active: true });
    return this.findOne(id);
  }

  async assignBus(routeId: string, busId: string): Promise<Route> {
    const route = await this.routeRepository.findOne({
      where: { id: routeId, is_active: true },
      relations: { buses: true },
    });

    if (!route) {
      throw new NotFoundException(`La ruta ${routeId} no existe`);
    }

    const bus = await this.findBus(busId);

    // Validar que el bus no esté en mantenimiento o fuera de servicio
    if (
      bus.status === BusStatus.MANTENIMIENTO ||
      bus.status === BusStatus.FUERA_DE_SERVICIO
    ) {
      throw new BadRequestException(
        `No se puede asignar el bus ${bus.plate} porque está en estado: ${bus.status}`,
      );
    }

    // Verificar que el bus tenga asientos configurados
    const busWithSeats = await this.busRepository.findOne({
      where: { id: busId },
      relations: { stacks: { seats: true } },
    });

    if (!busWithSeats?.stacks) {
      throw new BadRequestException(
        `El bus ${bus.plate} no tiene un stack de asientos configurado`,
      );
    }

    const activeSeats =
      busWithSeats.stacks?.reduce((total, stack) => {
        return total + (stack.seats?.filter((s) => s.is_active).length || 0);
      }, 0) || 0;

    if (activeSeats === 0) {
      throw new BadRequestException(
        `El bus ${bus.plate} no tiene asientos activos`,
      );
    }

    // Verificar si el bus ya está asignado
    const busAlreadyAssigned = route.buses.some((b) => b.id === busId);
    if (busAlreadyAssigned) {
      throw new BadRequestException('El bus ya está asignado a esta ruta');
    }

    route.buses.push(bus);
    await this.routeRepository.save(route);

    return this.findOne(routeId);
  }

  async getBusesForRoute(routeId: string): Promise<Bus[]> {
    const route = await this.routeRepository.findOne({
      where: { id: routeId, is_active: true },
      relations: {
        buses: {
          stacks: {
            seats: true,
          },
        },
      },
    });

    if (!route) {
      throw new NotFoundException(`La ruta ${routeId} no existe`);
    }

    // Filtrar solo buses que tengan stacks con asientos activos
    return route.buses.filter((bus) => {
      if (!bus.is_active) return false;
      if (!bus.stacks || bus.stacks.length === 0) return false;

      const totalActiveSeats = bus.stacks.reduce((total, stack) => {
        return (
          total + (stack.seats?.filter((seat) => seat.is_active).length || 0)
        );
      }, 0);

      return totalActiveSeats > 0;
    });
  }

  async removeBus(routeId: string, busId: string): Promise<Route> {
    const route = await this.routeRepository.findOne({
      where: { id: routeId },
      relations: { buses: true, trips: true },
    });

    if (!route) {
      throw new NotFoundException(`La ruta ${routeId} no existe`);
    }

    // Validar que el bus no tenga viajes activos en esta ruta
    const activeTripsWithBus =
      route.trips?.filter(
        (trip) =>
          trip.bus.id === busId &&
          (trip.status === TripStatus.SCHEDULED ||
            trip.status === TripStatus.IN_PROGRESS),
      ) || [];

    if (activeTripsWithBus.length > 0) {
      throw new BadRequestException(
        `No se puede desasignar el bus porque tiene ${activeTripsWithBus.length} viaje(s) activo(s) en esta ruta`,
      );
    }

    route.buses = route.buses.filter((bus) => bus.id !== busId);
    await this.routeRepository.save(route);

    return this.findOne(routeId);
  }

  // Métodos auxiliares privados
  private async findCity(cityId: string): Promise<City> {
    const city = await this.cityRepository.findOne({
      where: { id: cityId, is_active: true },
    });

    if (!city) {
      throw new NotFoundException(`La ciudad ${cityId} no existe o no está activa`);
    }

    return city;
  }

  private async findBus(busId: string): Promise<Bus> {
    const bus = await this.busRepository.findOne({
      where: { id: busId, is_active: true },
    });

    if (!bus) {
      throw new NotFoundException(`El bus ${busId} no existe o no está activo`);
    }

    return bus;
  }

  private async findBuses(busIds: string[]): Promise<Bus[]> {
    const buses = await this.busRepository.find({
      where: { id: In(busIds), is_active: true },
    });

    if (buses.length !== busIds.length) {
      throw new NotFoundException(
        'Algunos buses no existen o no están activos',
      );
    }

    return buses;
  }
}