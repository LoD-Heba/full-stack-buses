import { Injectable, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeatStack } from './entities/seat-stack.entity';
import { CreateSeatStackDto } from './dto/create-seat-stack.dto';
import { UpdateSeatStackDto } from './dto/update-seat-stack.dto';

@Injectable()
export class SeatStacksService {
  constructor(
    @InjectRepository(SeatStack)
    private readonly seatStackRepository: Repository<SeatStack>,
  ) {}
  async create(createSeatStackDto: CreateSeatStackDto) {
    const seatStack = this.seatStackRepository.create(createSeatStackDto);
    return this.seatStackRepository.save(seatStack);
  }

  async findAll() {
    const data = this.seatStackRepository.find(
      {
        relations:{seats: true}
      }
    );
    return data
  }

  async findOne(id: string) {
    const seatStack = await this.seatStackRepository.findOne({ where: { id }, relations:{seats:true} });
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
    return('El stack fue eliminado correctamente')
  }
}
