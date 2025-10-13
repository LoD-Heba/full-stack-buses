import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Route } from '../../route/entities/route.entity';

@Entity('cities')
export class City {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 100 })
  department: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true, name: 'image_url' })
  image_url: string;

  @Column({ type: 'simple-array', nullable: true, name: 'schedule' })
  schedule: string[]; 

  @Column({ default: true, name: 'is_active' })
  is_active: boolean;

  // Unas rutas tienen esta ciudad como ORIGEN
  @OneToMany(() => Route, (route) => route.originCity)
  originRoutes: Route[];

  // Unas rutas tienen esta ciudad como DESTINO
  @OneToMany(() => Route, (route) => route.destinationCity)
  destinationRoutes: Route[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
