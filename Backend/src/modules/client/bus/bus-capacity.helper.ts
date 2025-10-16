import { Repository } from 'typeorm';
import { Bus } from './entities/bus.entity';
import { Seat } from '../seat/entities/seat.entity';

export class BusCapacityHelper {
  constructor(
    private busRepository: Repository<Bus>,
    private seatRepository: Repository<Seat>,
  ) {}

  /**
   * Calcula la capacidad total de asientos activos de un bus
   */
  async calculateBusCapacity(busId: string): Promise<number> {
    const count = await this.seatRepository
      .createQueryBuilder('seat')
      .leftJoin('seat.stacks', 'stack')
      .where('stack.bus_id = :busId', { busId })
      .andWhere('seat.is_active = :active', { active: true })
      .getCount();

    return count;
  }

  /**
   * Calcula la capacidad para múltiples buses
   */
  async calculateMultipleBusesCapacity(busIds: string[]): Promise<Map<string, number>> {
    const results = await this.seatRepository
      .createQueryBuilder('seat')
      .select('stack.bus_id', 'busId')
      .addSelect('COUNT(seat.id)', 'capacity')
      .leftJoin('seat.stacks', 'stack')
      .where('stack.bus_id IN (:...busIds)', { busIds })
      .andWhere('seat.is_active = :active', { active: true })
      .groupBy('stack.bus_id')
      .getRawMany();

    const capacityMap = new Map<string, number>();
    busIds.forEach(id => capacityMap.set(id, 0));
    
    results.forEach(row => {
      capacityMap.set(row.busId, parseInt(row.capacity));
    });

    return capacityMap;
  }

  /**
   * Enriquece una lista de buses con su capacidad calculada
   */
  async enrichBusesWithCapacity(buses: Bus[]): Promise<any[]> {
    const busIds = buses.map(b => b.id);
    const capacityMap = await this.calculateMultipleBusesCapacity(busIds);

    return buses.map(bus => ({
      ...bus,
      capacity: capacityMap.get(bus.id) || 0,
    }));
  }
}