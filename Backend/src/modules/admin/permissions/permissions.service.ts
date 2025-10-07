import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Role } from '../role/entities/role.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  /*********************************************************************** */
  async create(createPermissionDto: CreatePermissionDto) {
    await this.checkIfPermissionsNameExists(createPermissionDto.name);

    const newPermission = this.permissionsRepository.create(createPermissionDto);
    return this.permissionsRepository.save(newPermission);
  }
  /***************************************************************** */

  async findAll() {
    return this.permissionsRepository.find();
  }

  async findOne(id: string) {
    return this.permissionsRepository.findOne({ where: { id } });
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    return this.permissionsRepository.update(id, updatePermissionDto);
  }

  async remove(id: string) {
    const deletePermission = await this.permissionsRepository.delete(id);
    return (deletePermission + `El permiso ${id} fue eliminado`)
  }

  /*********************************************************************** */
private async checkIfPermissionsNameExists(name: string, excludeId?: string): Promise<void> {
    const existingPermission = await this.permissionsRepository.findOne({
      where: { name, isActive: true },
    });

    // Si existe un role con ese nombre y no es el mismo que estamos actualizando
    if (existingPermission && existingPermission.id !== excludeId) {
      throw new BadRequestException(
        `Ya existe un permiso con el nombre "${name}".`,
      );
    }
  }
}
