import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
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

    // Validar nombre único
    const exists = await this.roleRepository.findOne({ where: { name } });
    if (exists) throw new ConflictException(`El rol "${name}" ya existe.`);

    // // Validar permisos
    // if (!permissionIds || permissionIds.length === 0) {
    //   throw new BadRequestException('Debe asignar al menos un permiso.');
    // }

    // const permissions = await this.permissionRepository.find({
    //   where: { id: In(permissionIds) },
    // });

    // if (permissions.length !== permissionIds.length) {
    //   throw new BadRequestException('Algunos permisos no existen.');
    // }

    const newRole = this.roleRepository.create(createRoleDto); // permissions: permissions })
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
      relations: {
        user:true,
      }
    });
  }

  /************************ FIND ONE ***************************/
  async findOne(id: string) {
    const role = await this.roleRepository.findOne({
      where: { id }
    });

    if (!role) throw new NotFoundException(`Rol con ID ${id} no existe.`);
    return role;
  }

  /************************ UPDATE ***************************/
  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const { name } = updateRoleDto;

    // Verificar rol
    await this.findOne(id);

    // Validar nombre único
    if (name) {
      const exists = await this.roleRepository.findOne({ where: { name } });
      if (exists && exists.id !== id) { // Si el rol existe y no es el mismo que se está actualizando
        throw new ConflictException(`Ya existe un rol con el nombre "${name}".`);
      }
    }

    // let permissions;
    // if (permissionIds && permissionIds.length > 0) { // Si se proporcionan nuevos permisos
    //   permissions = await this.permissionRepository.find({ 
    //     where: { id: In(permissionIds) }, //Donde el id esté en el arreglo permissionId
    //   });
    // }

    const role = await this.roleRepository.preload({ //preload busca el rol por
      id,
      ...updateRoleDto, // Si permissions es undefined, no actualizará los permisos
    });

    if (!role) throw new NotFoundException(`Rol con ID ${id} no se ha encontrado.`);
    
    return await this.roleRepository.save(role);
  }

  /************************ SOFT DELETE ***************************/
  async deactivate(id: string) {
    const role = await this.findOne(id);

    // Evitar desactivar rol "user"
    if (role.name === 'user') {
      throw new BadRequestException('El rol "user" no puede ser desactivado.');
    }

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

    // Proteger rol "user"
    if (roleToDelete.name === 'user' || roleToDelete.name === 'admin') {
      throw new BadRequestException('El rol user y admin no puede ser eliminado.');
    }

    // Buscar rol por defecto "user"
    const defaultRole = await this.roleRepository.findOne({
      where: { name: 'user', isActive: true },
    });
    if (!defaultRole) {
      throw new BadRequestException('El rol "user" no existe. Debes crearlo primero.');
    }

    // Reasignar usuarios al rol "user"
    if (roleToDelete.user && roleToDelete.user.length > 0) {
      for (const user of roleToDelete.user) {
        user.roles = defaultRole;
        await this.userRepository.save(user);
      }
    }

    // Eliminar rol definitivamente
    await this.roleRepository.remove(roleToDelete);
    return { message: `Rol "${roleToDelete.name}" eliminado y usuarios reasignados al rol "user".` };
  }
}
