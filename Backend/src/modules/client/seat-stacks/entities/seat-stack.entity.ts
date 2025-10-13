import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Seat } from '../../seat/entities/seat.entity';
import { Bus } from '../../bus/entities/bus.entity';

@Entity('seat_stacks')
export class SeatStack {
  @PrimaryGeneratedColumn('uuid') //añadir uuid
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // ✅ IMPORTANTE: cascade: ['remove'] permite eliminar seats automáticamente
  @OneToMany(() => Seat, (seat) => seat.stacks, {
    cascade: ['remove'], // Elimina seats cuando se elimina el stack
  })
  seats: Seat[];

  // ⚠️ CRÍTICO: Sin cascade en esta dirección
  // El bus NO se elimina cuando se elimina el stack
  @OneToOne(() => Bus, (bus) => bus.stacks)
  bus: Bus;
}
