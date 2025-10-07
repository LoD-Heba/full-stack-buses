import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Bus } from '../../bus/entities/bus.entity';
import { Route } from '../../route/entities/route.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn('uuid') // Cambiado a UUID por consistencia
  id: string;

  @Column({ type: 'timestamp' })
  departure_time: Date; // fecha y hora de salida

  @Column({ type: 'timestamp' })
  arrival_time: Date; // fecha y hora de llegada

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // precio base del viaje

  @Column({ 
    type: 'enum', 
    enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'SCHEDULED' 
  })
  status: string; // estado del viaje

  @Column({ type: 'int', default: 0 })
  available_seats: number; // asientos disponibles (calculado)

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relación con Bus (N:1)
  @ManyToOne(() => Bus, (bus) => bus.trips, { 
    onDelete: 'CASCADE',
    nullable: false 
  })
  @JoinColumn({ name: 'bus_id' })
  bus: Bus;

  // Relación con Route (N:1)
  @ManyToOne(() => Route, (route) => route.trips, { 
    onDelete: 'CASCADE',
    nullable: false 
  })
  @JoinColumn({ name: 'route_id' })
  route: Route;

  // Relación con Ticket (1:N)
  @OneToMany(() => Ticket, (ticket) => ticket.trip)
  tickets: Ticket[];
}