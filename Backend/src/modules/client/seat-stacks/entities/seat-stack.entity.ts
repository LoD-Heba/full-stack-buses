import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
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

  @Column({ type: 'int', default: 1 })
  floor_number: number;

  // ✅ IMPORTANTE: cascade: ['remove'] permite eliminar seats automáticamente
  @OneToMany(() => Seat, (seat) => seat.stacks, {
    cascade: ['remove'], // Elimina seats cuando se elimina el stack
  })
  seats: Seat[];

  @ManyToOne(() => Bus, (bus) => bus.stacks, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bus_id' })
  bus: Bus;
}
