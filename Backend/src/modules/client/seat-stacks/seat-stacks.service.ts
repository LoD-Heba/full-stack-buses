import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeatStack } from './entities/seat-stack.entity';
import { CreateSeatStackDto } from './dto/create-seat-stack.dto';
import { UpdateSeatStackDto } from './dto/update-seat-stack.dto';
import { Bus } from '../bus/entities/bus.entity';

@Injectable()
export class SeatStacksService {
  constructor(
    @InjectRepository(SeatStack)
    private readonly seatStackRepository: Repository<SeatStack>,

    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
  ) {}
  async create(createSeatStackDto: CreateSeatStackDto) {
    const { ...stackData } = createSeatStackDto;

    const seatStack = this.seatStackRepository.create({ ...stackData });

    const newStack = this.seatStackRepository.save(seatStack);
    return this.findOne((await newStack).id);
  }

  async findAll() {
    const data = this.seatStackRepository.find({
      relations: { seats: true, bus: true },
    });
    return data;
  }

  async findOne(id: string) {
    const seatStack = await this.seatStackRepository.findOne({
      where: { id },
      relations: { seats: true, bus: true },
    });
    if (!seatStack) {
      throw new NotFoundException(`El stack ${id} no ha sido encontrado`);
    }
    return seatStack;
  }

  async update(id: string, updateSeatStackDto: UpdateSeatStackDto) {
    const seatStack = await this.findOne(id);
    Object.assign(seatStack, updateSeatStackDto);
    return this.seatStackRepository.save(seatStack);
  }

  async remove(id: string) {
    const deleteStack = await this.findOne(id);
    await this.seatStackRepository.remove(deleteStack);
    return 'El stack fue eliminado correctamente';
  }
}
