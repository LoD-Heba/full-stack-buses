import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('role')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @OneToMany(() => User, (user) => user.roles)
  user: User[];

  // @ManyToMany(() => Permission, (permission) => permission.roles, {
  //   //eager: true, // opcional, depende de tu caso de uso
  //   cascade: true, // opcional, permite crear permisos nuevos al crear un rol
  // })
  // @JoinTable({
  //   // Nombre de la tabla intermedia
  //     name: 'role_permissions', 
  //   // Define la columna que apunta a LA ENTIDAD ACTUAL (Role)
  //   joinColumn: {
  //     name: 'role_id', //    Nombre de la columna en la tabla intermedia
  //     referencedColumnName: 'id', //    A qué columna de Role apunta (normalmente 'id')
  //   },
  //   // Define la columna que apunta a LA OTRA ENTIDAD (Permission)
  //   inverseJoinColumn: {
  //     name: 'permission_id', //    Nombre de la columna en la tabla intermedia
  //     referencedColumnName: 'id', //    A qué columna de Permission apunta
  //   },
  // })
  // permissions: Permission[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
