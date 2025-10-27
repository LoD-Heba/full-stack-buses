import { 
  Column, 
  Entity, 
  PrimaryGeneratedColumn, 
  OneToMany, 
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { UserProfile } from 'src/modules/admin/user-profile/entities/user-profile.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ['niño', 'adulto', 'adulto_mayor', 'estudiante'],
    default: 'adulto',
  })
  category: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ['EFECTIVO', 'TARJETA', 'QR', 'TRANSFERENCIA'],
    default: 'EFECTIVO',
  })
  method: string;

  @Column({
    type: 'enum',
    enum: ['PENDIENTE', 'COMPLETO', 'FALLIDO', 'REEMBOLSO'],
    default: 'PENDIENTE',
  })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  payment_date: Date;

  // ✅ AGREGAR: Campo para ID de transacción de Stripe
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  transaction_id?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  transaction_reference?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // ✅ AGREGAR: Relación con UserProfile
  @ManyToOne(() => UserProfile, (profile) => profile.payments, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_profile_id' })
  userProfile?: UserProfile;

  @OneToMany(() => Ticket, (ticket) => ticket.payment)
  tickets: Ticket[];
}