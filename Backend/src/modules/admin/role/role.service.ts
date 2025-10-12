import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { User } from '../user/entities/user.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /************************ CREATE ***************************/
  async create(createRoleDto: CreateRoleDto) {
    const { name } = createRoleDto;

    // 🔎 Verificar nombre único
    const exists = await this.roleRepository.findOne({ where: { name } });
    if (exists) throw new ConflictException(`El rol "${name}" ya existe.`);

    // Crear y guardar rol
    const newRole = this.roleRepository.create(createRoleDto);
    return await this.roleRepository.save(newRole);
  }

  /************************ FIND ALL ***************************/
  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 5 } = paginationDto;
    const offset = (page - 1) * limit;

    return await this.roleRepository.find({
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
      relations: { user: true },
    });
  }

  /************************ FIND ONE ***************************/
  async findOne(id: string) {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!role) throw new NotFoundException(`Rol con ID ${id} no existe.`);
    return role;
  }

  /************************ UPDATE ***************************/
  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const { name } = updateRoleDto;

    // Verificar existencia
    await this.findOne(id);

    // Validar nombre único
    if (name) {
      const exists = await this.roleRepository.findOne({ where: { name } });
      if (exists && exists.id !== id) {
        throw new ConflictException(`Ya existe un rol con el nombre "${name}".`);
      }
    }

    const role = await this.roleRepository.preload({
      id,
      ...updateRoleDto,
    });

    if (!role)
      throw new NotFoundException(`Rol con ID ${id} no se ha encontrado.`);

    return await this.roleRepository.save(role);
  }

  /************************ SOFT DELETE ***************************/
  async deactivate(id: string) {
    const role = await this.findOne(id);

    // Proteger rol base
    if (role.name === 'user') {
      throw new BadRequestException('El rol "user" no puede ser desactivado.');
    }

    // Marcar como inactivo
    role.isActive = false;
    return await this.roleRepository.save(role);
  }

  /************************ RESTORE ***************************/
  async restore(id: string) {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException(`Rol con ID ${id} no existe.`);

    role.isActive = true;
    return await this.roleRepository.save(role);
  }

  /************************ DELETE ***************************/
  async remove(id: string) {
    const roleToDelete = await this.findOne(id);

    // 🔒 Evitar eliminar roles críticos
    if (roleToDelete.name === 'user' || roleToDelete.name === 'admin') {
      throw new BadRequestException(
        'Los roles "user" y "admin" no pueden ser eliminados.',
      );
    }

    // ⚠️ Solo se puede eliminar si está desactivado
    if (roleToDelete.isActive) {
      throw new BadRequestException(
        'Debes desactivar el rol antes de eliminarlo.',
      );
    }

    // 🔍 Buscar rol por defecto "user"
    const defaultRole = await this.roleRepository.findOne({
      where: { name: 'user', isActive: true },
    });
    if (!defaultRole) {
      throw new BadRequestException(
        'El rol "user" no existe o está inactivo. Debes crearlo primero.',
      );
    }

    // 🔄 Buscar y reasignar usuarios que tengan este rol
    const usersWithRole = await this.userRepository.find({
      where: { roles: { id } }, // Usa "roles" si tu relación es ManyToMany
      relations: ['role'],
    });

    for (const user of usersWithRole) {
      user.roles = defaultRole; // ⚠️ Asegúrate de usar el nombre correcto en tu entidad User
      await this.userRepository.save(user);
    }

    // 🗑️ Eliminar el rol definitivamente
    await this.roleRepository.remove(roleToDelete);

    return {
      message: `Rol "${roleToDelete.name}" eliminado y ${usersWithRole.length} usuario(s) reasignado(s) al rol "user".`,
    };
  }
}
