import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Trip } from '../../trip/entities/trip.entity';
import { Seat } from '../../seat/entities/seat.entity';
import { Payment } from '../../payment/entities/payment.entity';
import { User } from 'src/modules/admin/user/entities/user.entity';
import { UserProfile } from 'src/modules/admin/user-profile/entities/user-profile.entity';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  ticket_id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  code: string; // código único del ticket (ej: TCK-2025-0001)

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  booking_date: Date;

  @Column({
    type: 'enum',
    enum: ['PENDIENTE', 'CONFIRMADO', 'CANCELADO'],
    default: 'PENDIENTE',
  })
  status: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relación con Trip (N:1)
  @ManyToOne(() => Trip, (trip) => trip.tickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  // Relación con Seat (N:1)
  @ManyToOne(() => Seat, (seat) => seat.tickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seat_id' })
  seat: Seat;

  // Relación con User (para usuarios registrados, OPCIONAL)
  @ManyToOne(() => User, (user) => user.tickets, {
    onDelete: 'CASCADE',
    nullable: true, // ← Cambiar a true
  })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  // ✅ AGREGAR: Relación con UserProfile (para clientes, REQUERIDO)
  @ManyToOne(() => UserProfile, (profile) => profile.tickets, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'user_profile_id' })
  userProfile: UserProfile;

  // Relación con Payment (N:1, opcional)
  @ManyToOne(() => Payment, (payment) => payment.tickets, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'payment_id' })
  payment?: Payment;
}
