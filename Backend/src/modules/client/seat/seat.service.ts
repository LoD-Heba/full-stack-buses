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
import {
  SeatStatus,
  TicketStatus,
  TripStatus,
} from 'src/common/enums/status.enum';
import { CreateBulkSeatsDto } from './dto/create-bulk-seats.dto';

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

      // Verificar que el stack existe
      const stack = await manager.findOne(SeatStack, {
        where: { id: stackId },
        relations: { bus: true },
      });

      if (!stack) {
        throw new NotFoundException(
          `El stack de asientos ${stackId} no existe`,
        );
      }

      // Evitar agregar asientos a un bus inactivo
      if (stack.bus && !stack.bus.is_active) {
        throw new BadRequestException(
          'No se pueden agregar asientos a un stack de un bus inactivo',
        );
      }

      // Verificar que el código de asiento sea único dentro del stack
      const existingSeatCode = await manager.findOne(Seat, {
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
      const existingSeatNumber = await manager.findOne(Seat, {
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

      // Crear el asiento con todos los datos
      const seat = manager.create(Seat, {
        seat_code: seatData.seat_code.toUpperCase(),
        seat_number: seatData.seat_number,
        deck: seatData.deck || stack.floor_number || 1,
        type: seatData.type,
        position_x: seatData.position_x,
        position_y: seatData.position_y,
        visual_type: seatData.visual_type || 'seat',
        rotation: seatData.rotation || 0,
        meta: seatData.meta || {},
        is_active: seatData.is_active !== undefined ? seatData.is_active : true,
        status: SeatStatus.AVAILABLE,
        stacks: stack,
      });

      const savedSeat = await manager.save(Seat, seat);

      // Actualizar la capacidad del bus
      await this.updateBusCapacityInTransaction(stackId, manager);

      // Retornar el asiento con sus relaciones cargadas
      return {
        ...savedSeat,
        stacks: stack,
      } as Seat;
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
    return this.seatRepository.find({
      where: {
        stacks: { id: stackId },
        is_active: true,
        status: SeatStatus.AVAILABLE,
      },
      relations: { stacks: true },
      order: { seat_number: 'ASC' },
    });
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

  async createBulk(createBulkDto: CreateBulkSeatsDto): Promise<Seat[]> {
    return await this.seatRepository.manager.transaction(async (manager) => {
      const { stackId, seats: seatsData } = createBulkDto;

      // Verificar que el stack existe
      const stack = await manager.findOne(SeatStack, {
        where: { id: stackId },
        relations: { bus: true, seats: true },
      });

      if (!stack) {
        throw new NotFoundException(`El stack ${stackId} no existe`);
      }

      // Validar que el bus esté activo
      if (stack.bus && !stack.bus.is_active) {
        throw new BadRequestException(
          'No se pueden agregar asientos a un stack de un bus inactivo',
        );
      }

      // Validar límites según tipo de bus
      const existingSeatsCount =
        stack.seats?.filter((s) => s.is_active).length || 0;
      const maxSeats =
        stack.bus.service_type === 'cama'
          ? 40
          : stack.bus.service_type === 'semi_cama'
            ? 48
            : 60;

      if (existingSeatsCount + seatsData.length > maxSeats) {
        throw new BadRequestException(
          `El bus tipo ${stack.bus.service_type} no puede tener más de ${maxSeats} asientos. Actual: ${existingSeatsCount}, intentando agregar: ${seatsData.length}`,
        );
      }

      // Validar unicidad de seat_code y seat_number
      // ✅ CAMBIO 1: Filtrar solo asientos (visual_type === 'seat')
      const existingSeatCodes =
        stack.seats
          ?.filter((s) => s.visual_type === 'seat')
          ?.map((s) => s.seat_code.toUpperCase()) || [];

      const existingSeatNumbers =
        stack.seats
          ?.filter(
            (s) =>
              s.visual_type === 'seat' &&
              s.seat_number !== null &&
              s.seat_number !== undefined,
          )
          ?.map((s) => s.seat_number as number) || [];

      // ✅ CAMBIO 2: Filtrar solo asientos en el lote nuevo
      const newSeatCodes = seatsData
        .filter((s) => s.visual_type === 'seat')
        .map((s) => s.seat_code.toUpperCase());

      const newSeatNumbers = seatsData
        .filter(
          (s) =>
            s.visual_type === 'seat' &&
            s.seat_number !== null &&
            s.seat_number !== undefined,
        )
        .map((s) => s.seat_number as number);

      // Verificar duplicados en el lote nuevo
      const duplicateCodes = newSeatCodes.filter(
        (code, index) => newSeatCodes.indexOf(code) !== index,
      );
      if (duplicateCodes.length > 0) {
        throw new BadRequestException(
          `Códigos duplicados en el lote: ${duplicateCodes.join(', ')}`,
        );
      }

      // ✅ CAMBIO 3: Solo validar números duplicados si existen
      if (newSeatNumbers.length > 0) {
        const duplicateNumbers = newSeatNumbers.filter(
          (num, index) => newSeatNumbers.indexOf(num) !== index,
        );
        if (duplicateNumbers.length > 0) {
          throw new BadRequestException(
            `Números duplicados en el lote: ${duplicateNumbers.join(', ')}`,
          );
        }
      }

      // Verificar conflictos con asientos existentes
      const conflictingCodes = newSeatCodes.filter((code) =>
        existingSeatCodes.includes(code),
      );
      if (conflictingCodes.length > 0) {
        throw new BadRequestException(
          `Códigos ya existentes: ${conflictingCodes.join(', ')}`,
        );
      }

      // ✅ CAMBIO 4: Validar números solo si existen ambos lados
      if (newSeatNumbers.length > 0 && existingSeatNumbers.length > 0) {
        const conflictingNumbers = newSeatNumbers.filter((num) =>
          existingSeatNumbers.includes(num),
        );
        if (conflictingNumbers.length > 0) {
          throw new BadRequestException(
            `Números de asiento ya existentes: ${conflictingNumbers.join(', ')}`,
          );
        }
      }

      // Crear todos los asientos
      const seats: Seat[] = [];
      for (const seatData of seatsData) {
        const seat = manager.create(Seat, {
          seat_code: seatData.seat_code.toUpperCase(),
          seat_number:
            seatData.visual_type === 'seat' ? seatData.seat_number : undefined,
          deck: seatData.deck || stack.floor_number || 1,
          type: seatData.type,
          position_x: seatData.position_x,
          position_y: seatData.position_y,
          visual_type: seatData.visual_type || 'seat',
          rotation: seatData.rotation || 0,
          meta: seatData.meta || {},
          is_active: true,
          status: SeatStatus.AVAILABLE,
          stacks: stack,
        });
        seats.push(seat);
      }

      const savedSeats = await manager.save(Seat, seats);

      return savedSeats;
    });
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
  async findAvailableForTrip(tripId: string, stackId: string): Promise<Seat[]> {
    return this.seatRepository
      .createQueryBuilder('seat')
      .leftJoinAndSelect('seat.stacks', 'stacks')
      .leftJoin('seat.tickets', 'ticket', 'ticket.trip_id = :tripId', {
        tripId,
      })
      .where('seat.stacks.id = :stackId', { stackId })
      .andWhere('seat.is_active = true')
      .andWhere('seat.status IN (:...statuses)', {
        statuses: [SeatStatus.AVAILABLE, SeatStatus.RESERVED],
      })
      .andWhere('ticket.id IS NULL')
      .orderBy('seat.seat_number', 'ASC')
      .getMany();
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
  }

  async getSeatsByTripWithStatus(tripId: string): Promise<any[]> {
    // Obtener el trip con su bus
    const trip = await this.tripRepository.findOne({
      where: { id: tripId, is_active: true },
      relations: ['bus'],
    });

    if (!trip) {
      throw new NotFoundException(`El viaje ${tripId} no existe`);
    }

    // Obtener todos los asientos del bus con sus tickets del viaje
    const seats = await this.seatRepository
      .createQueryBuilder('seat')
      .leftJoinAndSelect('seat.stacks', 'stack')
      .leftJoin(
        'seat.tickets',
        'ticket',
        'ticket.trip_id = :tripId AND ticket.is_active = true',
        { tripId },
      )
      .where('stack.bus_id = :busId', { busId: trip.bus.id })
      .andWhere('seat.is_active = true')
      .getMany();

    // Mapear asientos con su estado real según tickets
    return seats.map((seat) => {
      const ticket = seat.tickets?.find((t) => t.trip.id === tripId);

      let status = SeatStatus.AVAILABLE;
      if (ticket) {
        if (ticket.status === TicketStatus.CONFIRMED) {
          status = SeatStatus.OCCUPIED;
        } else if (ticket.status === TicketStatus.PENDING) {
          status = SeatStatus.RESERVED;
        }
      }

      return {
        id: seat.id,
        seat_code: seat.seat_code,
        seat_number: seat.seat_number,
        type: seat.type,
        position_x: seat.position_x,
        position_y: seat.position_y,
        visual_type: seat.visual_type,
        rotation: seat.rotation,
        deck: seat.deck,
        status, // ← Estado real basado en tickets
      };
    });
  }
}
