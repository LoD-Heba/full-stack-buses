import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Role } from '../../role/entities/role.entity';
import { UserProfile } from '../../user-profile/entities/user-profile.entity';
import { Bus } from 'src/modules/client/bus/entities/bus.entity';
import { Report } from 'src/modules/client/report/entities/report.entity';
import { News } from 'src/modules/client/news/entities/news.entity';
import { Ticket } from 'src/modules/client/tickets/entities/ticket.entity';

// Índice único compuesto para email y phone (no pueden ser ambos nulos)
@Index(['email'], { unique: true, where: '"email" IS NOT NULL' })
@Index(['phone'], { unique: true, where: '"phone" IS NOT NULL' })
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  // Email opcional (puede ser null si se usa phone)
  @Column({ length: 100, unique: true, nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  image_url?: string;
  
  // Phone opcional (puede ser null si se usa email)
  @Column({ length: 20, unique: true, nullable: true })
  phone?: string;

  @Column({ length: 100, select: false })
  password: string;

  @Column({ default: false, name: 'is_email_verified' })
  isEmailVerified: boolean;

  @Column({ default: false, name: 'is_phone_verified' })
  isPhoneVerified: boolean;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  //-----------------------------------------------------------------

  // Muchos usuarios pueden tener un rol (N:1)
  @ManyToOne(() => Role, (role) => role.user, {
    nullable: false,
  })
  @JoinColumn({ name: 'role_id' })
  roles: Role;

  // Un usuario tiene un perfil (1:1)
  @OneToOne(() => UserProfile, (profile) => profile.user, {
    cascade: true,
    nullable: true,
  })
  @JoinColumn({ name: 'profile_id' })
  profile?: UserProfile | null;

  // Un usuario puede tener muchos reportes (1:N)
  @OneToMany(() => Report, (report) => report.user, {
    cascade: true,
  })
  reports: Report[];

  // Un usuario puede gestionar muchos buses (1:N)
  @OneToMany(() => Bus, (bus) => bus.user)
  buses: Bus[];

  // Un usuario puede tener muchas noticias (1:N)
  @OneToMany(() => News, (news) => news.user)
  news: News[];

  // Un usuario puede tener muchos tickets (1:N)
  @OneToMany(() => Ticket, (ticket) => ticket.user)
  tickets: Ticket[];

  //-----------------------------------------------------------------
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
