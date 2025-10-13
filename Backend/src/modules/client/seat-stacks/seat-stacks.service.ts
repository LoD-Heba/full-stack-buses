import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

    const newStack = await this.seatStackRepository.save(seatStack);
    return this.findOne(newStack.id);
  }

  async findAll() {
    const data = await this.seatStackRepository.find({
      relations: { seats: true, bus: true },
    });
    return data;
  }

  async findOne(id: string) {
    const seatStack = await this.seatStackRepository.findOne({
      where: { id },
      relations: { seats: { tickets: true }, bus: true },
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
    const seatStack = await this.seatStackRepository.findOne({
      where: { id },
      relations: { 
        seats: { tickets: true }, 
        bus: true 
      },
    });

    if (!seatStack) {
      throw new NotFoundException(`El stack ${id} no ha sido encontrado`);
    }

    // ✅ VALIDACIÓN: Verificar si tiene asientos con tickets activos
    const hasActiveTickets = seatStack.seats?.some(seat => 
      seat.tickets?.some(ticket => 
        ticket.status === 'CONFIRMADO' || ticket.status === 'PENDIENTE'
      )
    );

    if (hasActiveTickets) {
      throw new BadRequestException(
        'No se puede eliminar el stack porque tiene asientos con tickets activos'
      );
    }

    let busId: string | null = null;

    if (seatStack.bus) {
      busId = seatStack.bus.id;
      
      // Método 1: Actualizar directamente en la base de datos
      await this.busRepository
        .createQueryBuilder()
        .update(Bus)
        .set({ 
          stacks: null as any,  // Forzar null
          capacity: 0 
        })
        .where('id = :busId', { busId })
        .execute();
    }

    // Ahora sí eliminar el stack (esto eliminará los asientos en cascada)
    await this.seatStackRepository.remove(seatStack);
    
    return { 
      message: 'El stack fue eliminado correctamente',
      busUpdated: busId
    };
  }
}