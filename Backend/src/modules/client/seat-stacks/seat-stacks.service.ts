import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeatStack } from './entities/seat-stack.entity';
import { CreateSeatStackDto } from './dto/create-seat-stack.dto';
import { UpdateSeatStackDto } from './dto/update-seat-stack.dto';
import { Bus } from '../bus/entities/bus.entity';
import { TripStatus } from 'src/common/enums/status.enum';

@Injectable()
export class SeatStacksService {
  constructor(
    @InjectRepository(SeatStack)
    private readonly seatStackRepository: Repository<SeatStack>,

    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
  ) {}

  async create(createSeatStackDto: CreateSeatStackDto) {
    const { busId, ...stackData } = createSeatStackDto;

    // Validar que el bus existe
    const bus = await this.busRepository.findOne({
      where: { id: busId, is_active: true },
      relations: { stacks: true },
    });

    if (!bus) {
      throw new NotFoundException(`El bus ${busId} no existe`);
    }

    // Validar que el floor_number no exceda el número de pisos del bus
    if (stackData.floor_number > bus.floors) {
      throw new BadRequestException(
        `El piso ${stackData.floor_number} excede el número de pisos del bus (${bus.floors})`,
      );
    }

    // Validar que no exista ya un stack para ese piso
    const existingStack = await this.seatStackRepository.findOne({
      where: {
        bus: { id: busId },
        floor_number: stackData.floor_number,
      },
    });

    if (existingStack) {
      throw new BadRequestException(
        `Ya existe un stack para el piso ${stackData.floor_number} en este bus`,
      );
    }

    const seatStack = this.seatStackRepository.create({
      ...stackData,
      bus,
    });

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
        bus: { trips: true },
      },
    });

    if (!seatStack) {
      throw new NotFoundException(`El stack ${id} no ha sido encontrado`);
    }

    // Validar viajes activos
    if (seatStack.bus) {
      const activeTrips =
        seatStack.bus.trips?.filter(
          (trip) =>
            trip.status === TripStatus.SCHEDULED ||
            trip.status === TripStatus.IN_PROGRESS,
        ) || [];

      if (activeTrips.length > 0) {
        throw new BadRequestException(
          `No se puede eliminar el stack porque el bus tiene ${activeTrips.length} viajes activos`,
        );
      }
    }

    // Verificar tickets activos
    const hasActiveTickets = seatStack.seats?.some((seat) =>
      seat.tickets?.some(
        (ticket) =>
          ticket.status === 'CONFIRMADO' || ticket.status === 'PENDIENTE',
      ),
    );

    if (hasActiveTickets) {
      throw new BadRequestException(
        'No se puede eliminar el stack porque tiene asientos con tickets activos',
      );
    }

    // Eliminar el stack (los asientos se eliminan en cascada)
    await this.seatStackRepository.remove(seatStack);

    return {
      message: 'El stack fue eliminado correctamente',
      busId: seatStack.bus?.id,
    };
  }

  // En Backend/src/modules/client/seat-stacks/seat-stacks.service.ts
  // Añadir al final, antes del método remove

  async getStackLayout(id: string) {
    const stack = await this.seatStackRepository.findOne({
      where: { id },
      relations: { seats: true, bus: true },
    });

    if (!stack) {
      throw new NotFoundException(`El stack ${id} no ha sido encontrado`);
    }

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
        }))
        .sort((a, b) => {
          if (a.position_y !== b.position_y) {
            return a.position_y - b.position_y;
          }
          return a.position_x - b.position_x;
        }) || [];

    return {
      stack_id: stack.id,
      stack_name: stack.name,
      floor_number: stack.floor_number || 1,
      bus: stack.bus
        ? {
            id: stack.bus.id,
            plate: stack.bus.plate,
            model: stack.bus.model,
            service_type: stack.bus.service_type,
          }
        : null,
      layout,
    };
  }
}
