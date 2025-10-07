import { Injectable, NotFoundException } from '@nestjs/common';
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
    const newCity = this.cityRepository.create(createCityDto);
    return await this.cityRepository.save(newCity);
  }

  findAll() {
    const getCitys = this.cityRepository.find({
      where: { is_active: true },
      order: { created_at: 'ASC' },
    });
    return getCitys;
  }

  async findOne(id: string) {
  const getCity = await this.cityRepository.findOne({
    where: { id },
  });

  if (!getCity) {
    throw new NotFoundException(
      `La ciudad con el id ${id} no existe o no está activa`,
    );
  }

  return getCity;
}


  async update(id: string, updateCityDto: UpdateCityDto) {
    const updateCity = await this.cityRepository.preload({
      id,
      ...updateCityDto,
    });
    this.findOne(id);
    return await this.cityRepository.save(updateCity!);
  }

async remove(id: string) {
  const deleteCity = await this.findOne(id);
  await this.cityRepository.remove(deleteCity!);
  return { message: 'Ciudad eliminada' };
}

}
