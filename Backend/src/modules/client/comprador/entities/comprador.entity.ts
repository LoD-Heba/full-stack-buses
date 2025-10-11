import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Report } from '../../report/entities/report.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';

@Index(['email'], { unique: true, where: '"email" IS NOT NULL' })
@Index(['ci'], { unique: true })
@Entity('compradores')
export class Comprador {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 100 })
  apellidos: string;

  @Column({ length: 100, unique: true, nullable: true })
  email?: string;

  @Column({ length: 20 })
  telefono: string;

  @Column({ length: 20, unique: true })
  ci: string;

  @Column({ type: 'text', nullable: true })
  direccion?: string;

  @Column({ type: 'date' })
  fecha_nacimiento: Date;

  @Column({ length: 50, default: 'Bolivia' })
  pais: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

//   // Relaciones
//   @OneToMany(() => Report, (report) => report.comprador, {
//     cascade: true,
//   })
//   reports: Report[];

//   @OneToMany(() => Ticket, (ticket) => ticket.comprador)
//   tickets: Ticket[];
}