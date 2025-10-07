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
  name:string

  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany(() => Seat, (seat) => seat.stacks)
  seats: Seat[];

  @OneToOne(() => Bus, (bus) => bus.stacks)
  bus: Bus;
}
