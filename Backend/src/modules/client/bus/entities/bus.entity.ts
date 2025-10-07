import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Trip } from '../../trip/entities/trip.entity';
import { Route } from '../../route/entities/route.entity';
import { User } from 'src/modules/admin/user/entities/user.entity';
import { SeatStack } from '../../seat-stacks/entities/seat-stack.entity';

@Entity('buses')
export class Bus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, unique: true })
  plate: string;

  @Column({ length: 100 })
  model: string;

  @Column({ nullable: true })
  year: number;

  @Column({ nullable: true })
  capacity: number; // Cantidad aproximada de asientos

  @Column({
    type: 'enum',
    enum: ['normal', 'semi_cama', 'cama'],
    default: 'normal',
    name: 'service_type',
  })
  service_type: string;

  @Column({ type: 'text', default: 'Asientos cómodos' })
  amenities: string;

  @Column({ 
    type: 'enum',
    enum: ['disponible', 'en_uso', 'mantenimiento', 'fuera_de_servicio'],
    default: 'disponible'
  })
  status: string;

  @Column({ default: true, name: 'is_active' })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Un bus tiene un stack (1:1)
  @OneToOne(() => SeatStack, (stacks) => stacks.bus, { 
    cascade: true,
    nullable: true 
  })
  @JoinColumn({ name: 'seat_stack_id' })
  stacks: SeatStack;

  // Un bus tiene muchos viajes (1:N)
  @OneToMany(() => Trip, (trip) => trip.bus)
  trips: Trip[];

  // Un bus puede tener muchas rutas y una ruta puede tener muchos buses (N:M)
  @ManyToMany(() => Route, (route) => route.buses)
  routes: Route[];

  // Muchos buses pueden ser gestionados por un usuario (N:1)
  @ManyToOne(() => User, (user) => user.buses, {
    nullable: false,
    onDelete: 'CASCADE', // Si el usuario se elimina, el bus también
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}