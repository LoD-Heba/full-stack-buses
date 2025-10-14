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
import { Ticket } from '../../tickets/entities/ticket.entity';
import { SeatStack } from '../../seat-stacks/entities/seat-stack.entity';

@Entity('seats')
export class Seat {
  @PrimaryGeneratedColumn('uuid') // Cambio a UUID por consistencia
  id: string;

  @Column({ unique: false }) // Único por stack, no globalmente
  seat_code: string;

  @Column({ type: 'int' })
  seat_number: number; // número de asiento

  @Column({
    type: 'enum',
    enum: ['normal', 'semi_cama', 'cama'],
    default: 'normal',
  })
  type: string;
  
  @Column({ type: 'int', nullable: true })
  position_x?: number;

  @Column({ type: 'int', nullable: true })
  position_y?: number;

  @Column({ type: 'varchar', default: 'seat', nullable: true })
  visual_type?: string; 

  @Column({ type: 'int', default: 0, nullable: true })
  rotation?: number;

  @Column({nullable: true})
  deck: number;

  @Column({ type: 'jsonb', nullable: true })
  meta?: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Muchos asientos pertenecen a un Stack
  @ManyToOne(() => SeatStack, (stack) => stack.seats, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'stack_id' })
  stacks: SeatStack;

  // Relación con Ticket (1:N)
  @OneToMany(() => Ticket, (ticket) => ticket.seat)
  tickets: Ticket[];
}
