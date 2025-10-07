import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { RegisterDto } from 'src/modules/auth/dto/register.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Crear usuario (Admin)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  // Registro público
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.userService.register(registerDto);
  }

  // Obtener todos los usuarios
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.userService.findAll(paginationDto);
  }

  // Búsqueda avanzada
  @Get('search')
  search(
    @Query() searchDto: SearchUserDto,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.userService.search(searchDto, paginationDto);
  }

  // Obtener usuario por ID
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOne(id);
  }

  // Obtener estadísticas del usuario
  @Get(':id/stats')
  getUserStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.getUserStats(id);
  }

  // Actualizar usuario
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  // Cambiar estado activo/inactivo
  @Patch(':id/active')
  toggleActive(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.toggleActive(id);
  }
 // Cambiar estado activo/inactivo
  @Patch(':id/deactive')
  toggleDeactive(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.toggleDeactive(id);
  }
  // Verificar email
  @Patch(':id/verify-email')
  verifyEmail(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.verifyEmail(id);
  }

  // Verificar teléfono
  @Patch(':id/verify-phone')
  verifyPhone(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.verifyPhone(id);
  }

  // Cambiar contraseña
  @Patch(':id/change-password')
  changePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.userService.changePassword(
      id,
      body.currentPassword,
      body.newPassword,
    );
  }

// Crear perfil para usuario
  @Post(':id/profile')
  createProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() profileData: any
  ) {
    return this.userService.createProfile(id, profileData);
  }

  // Actualizar perfil de usuario
  @Patch(':id/profile')
  updateProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() profileData: any
  ) {
    return this.userService.updateProfile(id, profileData);
  }

  // Eliminar perfil de usuario
  @Delete(':id/profile')
  removeProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.removeProfile(id);
  }

  // Eliminar usuario (soft delete)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.remove(id);
  }
}