import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { City } from '../../city/entities/city.entity';
import { Trip } from '../../trip/entities/trip.entity';
import { Bus } from '../../bus/entities/bus.entity';

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn('uuid') // Cambio a UUID por consistencia
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string; // Nombre descriptivo de la ruta (ej: "La Paz - Santa Cruz")

  @Column({ type: 'time', nullable: true })
  approx_duration: string; // duración aproximada (ej: '04:30:00')

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  distance_km: number; // distancia en kilómetros

  @Column({ type: 'text', nullable: true })
  description?: string; // descripción opcional de la ruta

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  base_price: number; // precio base para esta ruta

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relación con Ciudad de origen
  @ManyToOne(() => City, (city) => city.originRoutes, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'origin_city_id' })
  originCity: City;

  // Relación con Ciudad de destino
  @ManyToOne(() => City, (city) => city.destinationRoutes, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'destination_city_id' })
  destinationCity: City;

  // Buses asignados a esta ruta (Many-to-Many)
  @ManyToMany(() => Bus, (bus) => bus.routes)
  @JoinTable({
    name: 'bus_routes',
    joinColumn: { name: 'route_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'bus_id', referencedColumnName: 'id' },
  })
  buses: Bus[];

  // Relación con Trip (1:N)
  @OneToMany(() => Trip, (trip) => trip.route)
  trips: Trip[];
}