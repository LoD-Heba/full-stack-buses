import { User } from 'src/modules/admin/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  // Muchos reportes pueden ser creados por un usuario (N:1)
  @ManyToOne(() => User, (user) => user.reports, {
    eager: true,
  })
  @JoinColumn({ name: 'user_id' }) // FK en la tabla reports
  user: User;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  updated_at: Date | null;
}
