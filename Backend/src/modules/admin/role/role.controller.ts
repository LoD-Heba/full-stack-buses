import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { RolesGuard } from 'src/common/guard/role.guard';
import { JwtAuthGuard } from 'src/common/guard/auth.guard';
import { Roles } from 'src/common/decorators/role.decorator';
//Nota: Dependiendo del sitio donde se encuentre el decorador @UseFuards, se ejecuta los guards
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('admin')
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /************************ CREATE ***************************/
  @Post()
  async create(@Body() createRoleDto: CreateRoleDto) {
    console.log('createRoleDto:', createRoleDto);
    return await this.roleService.create(createRoleDto);
  }

  /************************ FIND ALL ***************************/
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    return await this.roleService.findAll(paginationDto);
  }

  /************************ FIND ONE ***************************/
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.roleService.findOne(id);
  }

  /************************ UPDATE ***************************/
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return await this.roleService.update(id, updateRoleDto);
  }

  /************************ DEACTIVATE / SOFT DELETE ***************************/
  @Patch(':id/deactivate')
  async deactivate(@Param('id') id: string) {
    return await this.roleService.deactivate(id);
  }

  /************************ RESTORE ***************************/
  @Patch(':id/restore')
  async restore(@Param('id') id: string) {
    return await this.roleService.restore(id);
  }

  /************************ DELETE DEFINITIVO ***************************/
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.roleService.remove(id);
  }
}
