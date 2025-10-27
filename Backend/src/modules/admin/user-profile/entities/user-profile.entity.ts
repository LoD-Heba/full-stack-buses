import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Ticket } from 'src/modules/client/tickets/entities/ticket.entity';
import { Payment } from 'src/modules/client/payment/entities/payment.entity';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, name: 'first_name', nullable: true })
  firstName?: string;

  @Column({ length: 50, name: 'last_name', nullable: true })
  lastName?: string;

  @Column({ length: 20, name: 'document_number', unique: true, nullable: true })
  documentNumber: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ length: 100, unique: true, nullable: true })
  email?: string;

  @Column({ length: 150, nullable: true })
  address?: string;

  @Column({ default: false, name: 'is_email_verified' })
  isEmailVerified: boolean;

  @Column({ default: false, name: 'is_phone_verified' })
  isPhoneVerified: boolean;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  // Campo para identificar si es un usuario invitado (sin cuenta)
  @Column({ default: false, name: 'is_guest' })
  isGuest: boolean;

  //-----------------------------------------------------------------

  @OneToMany(() => Ticket, (ticket) => ticket.userProfile)
  tickets: Ticket[];

  // Relación One-to-One inversa con User (NULLABLE para invitados)
  @OneToOne(() => User, (user) => user.profile, { nullable: true })
  user?: User;

  @OneToMany(() => Payment, (payment) => payment.userProfile)
  payments: Payment[];
  //-----------------------------------------------------------------

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
