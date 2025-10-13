import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, EntityManager } from 'typeorm';
import { CreateSeatDto, SeatType } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { SearchSeatDto } from './dto/search-seat.dto';
import { Seat } from './entities/seat.entity';
import { SeatStack } from '../seat-stacks/entities/seat-stack.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginatedResponse } from 'src/modules/auth/interfaces/auth.interfaces';
import { Bus } from '../bus/entities/bus.entity';
import { Trip } from '../trip/entities/trip.entity';
import { TicketStatus, TripStatus } from 'src/common/enums/status.enum';

@Injectable()
export class SeatService {
  constructor(
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
    @InjectRepository(SeatStack)
    private readonly seatStackRepository: Repository<SeatStack>,
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
    @InjectRepository(Trip) // AGREGAR ESTO
    private readonly tripRepository: Repository<Trip>, // AGREGAR ESTO
  ) {}

  async create(createSeatDto: CreateSeatDto): Promise<Seat> {
    return await this.seatRepository.manager.transaction(async (manager) => {
      const { stackId, ...seatData } = createSeatDto;

      //Evitar agregar asientos a un bus inactivo
      const stackWithBus = await this.seatStackRepository.findOne({
        where: { id: stackId },
        relations: { bus: true },
      });

      if (stackWithBus?.bus && !stackWithBus.bus.is_active) {
        throw new BadRequestException(
          'No se pueden agregar asientos a un stack de un bus inactivo',
        );
      }
      // Verificar que el stack existe
      const stack = await this.findSeatStack(stackId);

      // Verificar que el código de asiento sea único dentro del stack
      const existingSeatCode = await this.seatRepository.findOne({
        where: {
          seat_code: seatData.seat_code.toUpperCase(),
          stacks: { id: stackId },
          is_active: true,
        },
      });

      if (existingSeatCode) {
        throw new BadRequestException(
          `Ya existe un asiento con código ${seatData.seat_code} en este stack`,
        );
      }

      // Verificar que el número de asiento sea único dentro del stack
      const existingSeatNumber = await this.seatRepository.findOne({
        where: {
          seat_number: seatData.seat_number,
          stacks: { id: stackId },
          is_active: true,
        },
      });

      if (existingSeatNumber) {
        throw new BadRequestException(
          `Ya existe un asiento con número ${seatData.seat_number} en este stack`,
        );
      }

      // Crear el asiento
      const seat = manager.create(Seat, {
        ...seatData,
        seat_code: seatData.seat_code.toUpperCase(),
        stacks: stack,
      });

      const savedSeat = await manager.save(seat);
      await this.updateBusCapacityInTransaction(stackId, manager);

      // Actualizar la capacidad del bus automáticamente
      await this.updateBusCapacity(stackId);

      return this.findOne(savedSeat.id);
    });
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Seat>> {
    const { page = 1, limit = 10 } = paginationDto;

    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * take;

    const total = await this.seatRepository.count({
      where: { is_active: true },
    });

    const lastPage = Math.ceil(total / take);
    const hasNextPage = page < lastPage;
    const hasPrevPage = page > 1;

    const data = await this.seatRepository.find({
      where: { is_active: true },
      relations: {
        stacks: {
          bus: true,
        },
        tickets: true,
      },
      order: { seat_number: 'ASC' },
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

  async findOne(id: string): Promise<Seat> {
    const seat = await this.seatRepository.findOne({
      where: { id, is_active: true },
      relations: {
        stacks: {
          bus: true,
        },
        tickets: {
          trip: true,
        },
      },
    });

    if (!seat) {
      throw new NotFoundException(`El asiento con ID ${id} no existe`);
    }

    return seat;
  }

  async search(searchDto: SearchSeatDto, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const { stackId, type, deck, searchTerm } = searchDto;

    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * take;

    const queryBuilder = this.seatRepository
      .createQueryBuilder('seat')
      .leftJoinAndSelect('seat.stacks', 'stacks')
      .leftJoinAndSelect('stacks.bus', 'bus')
      .where('seat.is_active = :active', { active: true });

    // Filtros opcionales
    if (stackId) {
      queryBuilder.andWhere('stacks.id = :stackId', { stackId });
    }

    if (type) {
      queryBuilder.andWhere('seat.type = :type', { type });
    }

    if (deck) {
      queryBuilder.andWhere('seat.deck = :deck', { deck });
    }

    if (searchTerm) {
      queryBuilder.andWhere('seat.seat_code ILIKE :searchTerm', {
        searchTerm: `%${searchTerm}%`,
      });
    }

    const total = await queryBuilder.getCount();

    const data = await queryBuilder
      .orderBy('seat.seat_number', 'ASC')
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

  async findByStack(stackId: string): Promise<Seat[]> {
    return this.seatRepository.find({
      where: {
        stacks: { id: stackId },
        is_active: true,
      },
      relations: {
        stacks: true,
        tickets: true,
      },
      order: { seat_number: 'ASC' },
    });
  }

  async findAvailableByStack(stackId: string): Promise<Seat[]> {
    // Asientos sin tickets confirmados para viajes futuros
    return this.seatRepository
      .createQueryBuilder('seat')
      .leftJoinAndSelect('seat.stacks', 'stacks')
      .leftJoin('seat.tickets', 'tickets')
      .leftJoin('tickets.trip', 'trip')
      .where('seat.is_active = :active', { active: true })
      .andWhere('stacks.id = :stackId', { stackId })
      .andWhere(
        '(tickets.id IS NULL OR (tickets.status != :confirmed OR trip.departure_time < :now))',
        { confirmed: TicketStatus.CONFIRMED, now: new Date() },
      )
      .orderBy('seat.seat_number', 'ASC')
      .getMany();
  }

  async findByType(type: SeatType): Promise<Seat[]> {
    return this.seatRepository.find({
      where: {
        type,
        is_active: true,
      },
      relations: {
        stacks: {
          bus: true,
        },
      },
      order: { seat_number: 'ASC' },
    });
  }

  async update(id: string, updateSeatDto: UpdateSeatDto): Promise<Seat> {
    const { stackId, ...seatData } = updateSeatDto;

    // Verificar que el asiento existe
    const existingSeat = await this.findOne(id);

    // Verificar si el asiento tiene tickets confirmados
    const confirmedTickets =
      existingSeat.tickets?.filter(
        (ticket) => ticket.status === TicketStatus.CONFIRMED,
      ) || [];

    if (confirmedTickets.length > 0) {
      // No permitir cambios críticos si tiene tickets confirmados
      const criticalChanges = ['seat_number', 'seat_code', 'type'];
      const hasCriticalChanges = criticalChanges.some(
        (field) => seatData[field] !== undefined,
      );

      if (hasCriticalChanges) {
        throw new BadRequestException(
          'No se pueden modificar datos críticos de un asiento con tickets confirmados',
        );
      }
    }

    const updateData: any = { ...seatData };

    // Normalizar seat_code si se está actualizando
    if (seatData.seat_code) {
      updateData.seat_code = seatData.seat_code.toUpperCase();
    }

    // Si se proporciona stackId, verificar que el stack existe
    let stack: SeatStack | undefined;
    if (stackId) {
      stack = await this.findSeatStack(stackId);
    }

    // Verificar unicidad del código de asiento si se está actualizando
    if (
      updateData.seat_code &&
      updateData.seat_code !== existingSeat.seat_code
    ) {
      const targetStackId = stackId || existingSeat.stacks.id;
      const existingCode = await this.seatRepository.findOne({
        where: {
          seat_code: updateData.seat_code,
          stacks: { id: targetStackId },
          is_active: true,
          id: Not(id),
        },
      });

      if (existingCode) {
        throw new BadRequestException(
          `Ya existe un asiento con código ${updateData.seat_code} en este stack`,
        );
      }
    }

    // Verificar unicidad del número de asiento si se está actualizando
    if (
      seatData.seat_number &&
      seatData.seat_number !== existingSeat.seat_number
    ) {
      const targetStackId = stackId || existingSeat.stacks.id;
      const existingNumber = await this.seatRepository.findOne({
        where: {
          seat_number: seatData.seat_number,
          stacks: { id: targetStackId },
          is_active: true,
          id: Not(id),
        },
      });

      if (existingNumber) {
        throw new BadRequestException(
          `Ya existe un asiento con número ${seatData.seat_number} en este stack`,
        );
      }
    }

    // Verificar que hay algo para actualizar
    const hasDataToUpdate = Object.keys(updateData).length > 0;
    const hasStackToUpdate = stack !== undefined;

    if (!hasDataToUpdate && !hasStackToUpdate) {
      throw new BadRequestException('No hay datos para actualizar');
    }

    // Actualizar campos básicos si existen
    if (hasDataToUpdate) {
      await this.seatRepository.update(id, updateData);
    }

    // Actualizar stack si es necesario
    if (hasStackToUpdate) {
      await this.seatRepository.save({
        id,
        stacks: stack,
      });

      // Actualizar capacidad de ambos buses si se cambió de stack
      await this.updateBusCapacity(existingSeat.stacks.id);
      await this.updateBusCapacity(stackId!);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<Seat> {
    const seat = await this.findOne(id);

    // Verificar si tiene tickets confirmados
    const confirmedTickets =
      seat.tickets?.filter(
        (ticket) => ticket.status === TicketStatus.CONFIRMED,
      ) || [];

    if (confirmedTickets.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar un asiento que tiene tickets confirmados',
      );
    }

    const stackId = seat.stacks.id;

    // Realizar soft delete
    await this.seatRepository.update(id, { is_active: false });

    // Actualizar capacidad del bus
    await this.updateBusCapacity(stackId);

    // ====== AGREGAR: Actualizar available_seats de viajes activos del bus ======
    const stack = await this.seatStackRepository.findOne({
      where: { id: stackId },
      relations: { bus: { trips: true } },
    });

    if (stack?.bus?.trips) {
      const activeTrips = stack.bus.trips.filter(
        (trip) => trip.status === TripStatus.SCHEDULED && trip.is_active,
      );

      // Actualizar cada viaje activo (necesitarás inyectar TripService)
      for (const trip of activeTrips) {
        // Recalcular manualmente aquí para evitar dependencia circular
        const totalSeats = await this.seatRepository.count({
          where: { stacks: { id: stackId }, is_active: true },
        });
        await this.tripRepository.update(trip.id, {
          available_seats: totalSeats,
        });
      }
    }
    // ====================================

    return { ...seat, is_active: false };
  }

  async bulkCreateSeats(
    stackId: string,
    count: number,
    type: SeatType = SeatType.NORMAL,
  ): Promise<Seat[]> {
    if (count <= 0 || count > 50) {
      throw new BadRequestException(
        'El número de asientos debe estar entre 1 y 50',
      );
    }

    // Verificar que el stack existe
    const stack = await this.findSeatStack(stackId);

    // Validar límite según tipo de bus
    const existingSeatsCount = await this.seatRepository.count({
      where: { stacks: { id: stackId }, is_active: true },
    });

    const maxSeats =
      stack.bus.service_type === 'cama'
        ? 40
        : stack.bus.service_type === 'semi_cama'
          ? 48
          : 60;

    if (existingSeatsCount + count > maxSeats) {
      throw new BadRequestException(
        `El bus tipo ${stack.bus.service_type} no puede tener más de ${maxSeats} asientos (actual: ${existingSeatsCount})`,
      );
    }

    // Obtener el número más alto existente en el stack
    const lastSeat = await this.seatRepository.findOne({
      where: { stacks: { id: stackId } },
      order: { seat_number: 'DESC' },
    });

    const startNumber = (lastSeat?.seat_number || 0) + 1;
    const seats: Seat[] = [];

    for (let i = 0; i < count; i++) {
      const seatNumber = startNumber + i;
      const seatCode = `S${seatNumber.toString().padStart(2, '0')}`;

      const seat = this.seatRepository.create({
        seat_code: seatCode,
        seat_number: seatNumber,
        type,
        stacks: stack,
      });

      seats.push(seat);
    }

    const savedSeats = await this.seatRepository.save(seats);

    // Actualizar capacidad del bus
    await this.updateBusCapacity(stackId);

    return savedSeats;
  }

  async getSeatStatistics(id: string) {
    const seat = await this.findOne(id);

    const stats = await this.seatRepository
      .createQueryBuilder('seat')
      .leftJoin('seat.tickets', 'tickets')
      .select([
        'COUNT(tickets.ticket_id) as total_tickets',
        `COUNT(CASE WHEN tickets.status = '${TicketStatus.CONFIRMED}' THEN 1 END) as confirmed_tickets`,
        `COUNT(CASE WHEN tickets.status = '${TicketStatus.PENDING}' THEN 1 END) as pending_tickets`,
        `COUNT(CASE WHEN tickets.status = '${TicketStatus.CANCELLED}' THEN 1 END) as cancelled_tickets`,
        `SUM(CASE WHEN tickets.status = '${TicketStatus.CONFIRMED}' THEN tickets.price ELSE 0 END) as total_revenue`,
      ])
      .where('seat.id = :id', { id })
      .getRawOne();

    return {
      seat,
      statistics: {
        totalTickets: parseInt(stats.total_tickets) || 0,
        confirmedTickets: parseInt(stats.confirmed_tickets) || 0,
        pendingTickets: parseInt(stats.pending_tickets) || 0,
        cancelledTickets: parseInt(stats.cancelled_tickets) || 0,
        totalRevenue: parseFloat(stats.total_revenue) || 0,
        utilizationRate:
          stats.total_tickets > 0
            ? (
                ((parseInt(stats.confirmed_tickets) || 0) /
                  parseInt(stats.total_tickets)) *
                100
              ).toFixed(2)
            : '0',
      },
    };
  }

  // Métodos auxiliares privados
  private async findSeatStack(stackId: string): Promise<SeatStack> {
    const seatStack = await this.seatStackRepository.findOne({
      where: { id: stackId },
      relations: { bus: true },
    });

    if (!seatStack) {
      throw new NotFoundException(`El stack de asientos ${stackId} no existe`);
    }

    return seatStack;
  }

  private async updateBusCapacity(stackId: string): Promise<void> {
    // Contar asientos activos en el stack
    const activeSeatsCount = await this.seatRepository.count({
      where: {
        stacks: { id: stackId },
        is_active: true,
      },
    });

    // Obtener el stack con su bus
    const stack = await this.seatStackRepository.findOne({
      where: { id: stackId },
      relations: { bus: true },
    });

    if (stack?.bus) {
      // Actualizar la capacidad del bus
      await this.busRepository.update(stack.bus.id, {
        capacity: activeSeatsCount,
      });
    }
  }

  //Metodo auxiliar
  private async updateBusCapacityInTransaction(
    stackId: string,
    manager: EntityManager,
  ): Promise<void> {
    const activeSeatsCount = await manager.count(Seat, {
      where: {
        stacks: { id: stackId },
        is_active: true,
      },
    });

    const stack = await manager.findOne(SeatStack, {
      where: { id: stackId },
      relations: { bus: true },
    });

    if (stack?.bus) {
      await manager.update(Bus, stack.bus.id, {
        capacity: activeSeatsCount,
      });
    }
  }
}
