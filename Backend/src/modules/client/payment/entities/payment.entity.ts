import { 
  Column, 
  Entity, 
  PrimaryGeneratedColumn, 
  OneToMany, 
  CreateDateColumn,
  UpdateDateColumn 
} from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';

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
  amount: number; // monto pagado

  @Column({
    type: 'enum',
    enum: ['EFECTIVO', 'TARJETA', 'QR', 'TRANSFERENCIA'],
    default: 'EFECTIVO',
  })
  method: string; // método de pago

  @Column({
    type: 'enum',
    enum: ['PENDIENTE', 'COMPLETO', 'FALLIDO', 'REEMBOLSO'],
    default: 'PENDIENTE',
  })
  status: string; // estado del pago

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  payment_date: Date; // fecha del pago

  @Column({ type: 'varchar', length: 100, nullable: true })
  transaction_reference?: string; // referencia externa

  @Column({ type: 'text', nullable: true })
  notes?: string; // notas adicionales del pago

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relación con Tickets (1:N)
  @OneToMany(() => Ticket, (ticket) => ticket.payment)
  tickets: Ticket[];
}