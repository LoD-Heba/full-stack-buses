import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Route } from '../route/entities/route.entity';
import { Repository } from 'typeorm';
import { City } from './entities/city.entity';

@Injectable()
export class CityService {
  constructor(
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
  ) {}

  async create(createCityDto: CreateCityDto) {
    const exists = await this.cityRepository.findOne({
      where: {
        city: createCityDto.city,
        department: createCityDto.department,
      },
    });

    if (exists) {
      throw new ConflictException(
        `Ya existe ${createCityDto.city} en ${createCityDto.department}`,
      );
    }

    const newCity = this.cityRepository.create(createCityDto);
    return await this.cityRepository.save(newCity);
  }

  findAll(includeInactive = false) {
    const where = includeInactive ? {} : { is_active: true };
    return this.cityRepository.find({
      where,
      order: { created_at: 'DESC' },
      relations: ['originRoutes', 'destinationRoutes'],
    });
  }

  async findOne(id: string, includeInactive = false) {
    const where = includeInactive ? { id } : { id, is_active: true };
    
    const getCity = await this.cityRepository.findOne({
      where,
      relations: ['originRoutes', 'destinationRoutes'],
    });

    if (!getCity) {
      throw new NotFoundException(
        `La ciudad con el id ${id} no existe o no está activa`,
      );
    }

    return getCity;
  }

  async update(id: string, updateCityDto: UpdateCityDto) {
    await this.findOne(id); // Validar que existe

    const updateCity = await this.cityRepository.preload({
      id,
      ...updateCityDto,
    });

    if (!updateCity) {
      throw new NotFoundException(`Ciudad con ID ${id} no encontrada`);
    }

    return await this.cityRepository.save(updateCity);
  }

  async updateImageUrl(id: string, imageUrl: string): Promise<City> {
    const city = await this.findOne(id);
    await this.cityRepository.update(id, { image_url: imageUrl });
    return this.findOne(id);
  }

  /**
   * Soft delete - marca como inactiva
   * La ciudad sigue existiendo pero no aparece en listados normales
   */
  async softDelete(id: string) {
    const city = await this.findOne(id);

    // Verificar si hay rutas activas asociadas
    const activeRoutes = await this.routeRepository.count({
      where: [
        { originCity: { id } },
        { destinationCity: { id } },
      ],
    });

    if (activeRoutes > 0) {
      throw new BadRequestException(
        `No puedes desactivar esta ciudad porque tiene ${activeRoutes} ruta(s) asociada(s)`,
      );
    }

    await this.cityRepository.update(id, { is_active: false });
    return { message: 'Ciudad desactivada correctamente' };
  }

  /**
   * Hard delete - elimina completamente de la base de datos
   * Solo funciona si no hay rutas asociadas
   */
  async hardDelete(id: string) {
    const city = await this.findOne(id, true); // Permitir buscar inactivas

    // Verificar si hay rutas (activas o inactivas) asociadas
    const totalRoutes = await this.routeRepository.count({
      where: [
        { originCity: { id } },
        { destinationCity: { id } },
      ],
    });

    if (totalRoutes > 0) {
      throw new BadRequestException(
        `No puedes eliminar esta ciudad porque tiene ${totalRoutes} ruta(s) asociada(s). Primero elimina o reassigna las rutas.`,
      );
    }

    await this.cityRepository.remove(city);
    return { message: 'Ciudad eliminada completamente' };
  }

  /**
   * Obtener ciudades inactivas para administración
   */
  async findInactive() {
    return await this.cityRepository.find({
      where: { is_active: false },
      order: { updated_at: 'DESC' },
      relations: ['originRoutes', 'destinationRoutes'],
    });
  }

  /**
   * Reactivar una ciudad inactiva
   */
  async reactivate(id: string) {
    const city = await this.findOne(id, true);

    if (city.is_active) {
      throw new BadRequestException('Esta ciudad ya está activa');
    }

    await this.cityRepository.update(id, { is_active: true });
    return this.findOne(id);
  }

  /**
   * Obtener información de rutas asociadas
   */
  async getRelatedRoutes(id: string) {
    const city = await this.findOne(id, true);

    const originRoutes = await this.routeRepository.find({
      where: { originCity: { id } },
      relations: ['destinationCity'],
    });

    const destinationRoutes = await this.routeRepository.find({
      where: { destinationCity: { id } },
      relations: ['originCity'],
    });

    return {
      city,
      originRoutes,
      destinationRoutes,
      totalRoutes: originRoutes.length + destinationRoutes.length,
    };
  }
}