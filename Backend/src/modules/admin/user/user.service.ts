import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Or } from 'typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginatedResponse } from 'src/modules/auth/interfaces/auth.interfaces';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { User } from './entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { UserProfile } from '../user-profile/entities/user-profile.entity';
import { RegisterDto } from 'src/modules/auth/dto/register.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,

  ) {}

  /********************************* Crear usuario (Admin) ************************************** */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { roleId, password, email, phone, ...userData } = createUserDto;

    // Validar que se proporciona al menos email o phone
    if (!email && !phone) {
      throw new BadRequestException(
        'Debe proporcionar al menos email o teléfono',
      );
    }

    // Verificar que el rol existe
    const role = await this.findRoleOrThrow(roleId);

    // Verificar que email sea único si se proporciona
    if (email) {
      await this.checkEmailUnique(email);
    }

    // Verificar que phone sea único si se proporciona
    if (phone) {
      await this.checkPhoneUnique(phone);
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear el usuario
    const user = this.userRepository.create({
      ...userData,
      email,
      phone,
      password: hashedPassword,
      roles: role,
    });

    const savedUser = await this.userRepository.save(user);

    return this.findOne(savedUser.id);
  }

  /********************************* Registro público ************************************** */
  async register(registerDto: RegisterDto): Promise<User> {
    const { password, email, phone, ...userData } = registerDto;

    // Validar que se proporciona al menos email o phone
    if (!email && !phone) {
      throw new BadRequestException(
        'Debe proporcionar al menos email o teléfono',
      );
    }

    // Verificar que email sea único si se proporciona
    if (email) {
      await this.checkEmailUnique(email);
    }

    // Verificar que phone sea único si se proporciona
    if (phone) {
      await this.checkPhoneUnique(phone);
    }

    // Obtener rol por defecto (ej: "user" o "client")
    const defaultRole = await this.roleRepository.findOne({
      where: { name: 'user', isActive: true }, // O el nombre de tu rol por defecto
    });

    if (!defaultRole) {
      throw new BadRequestException(
        'Rol por defecto no configurado en el sistema',
      );
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear el usuario
    const user = this.userRepository.create({
      ...userData,
      email,
      phone,
      password: hashedPassword,
      roles: defaultRole,
    });

    const savedUser = await this.userRepository.save(user);

    return this.findOne(savedUser.id);
  }

  /**************************** Buscar todos los usuarios ************************************* */
  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<User>> {
    const { page = 1, limit = 10 } = paginationDto;

    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * take;

    const total = await this.userRepository.count({
      where: { isActive: true },
    });

    const lastPage = Math.ceil(total / take);
    const hasNextPage = page < lastPage;
    const hasPrevPage = page > 1;

    const data = await this.userRepository.find({
      relations: {
        roles: true,
        profile: true,
        buses: true,
        tickets: true,
      },
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage,
        limit: take,
        hasNextPage,
        hasPrevPage,
      },
    };
  }

  /***************************** Buscar usuarios con filtros ************************************ */
  async search(searchDto: SearchUserDto, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const { searchTerm, roleId, isActive, isEmailVerified, hasProfile } =
      searchDto;

    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * take;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('user.profile', 'profile');

    // Filtro de búsqueda por término
    if (searchTerm) {
      queryBuilder.where(
        '(user.name ILIKE :searchTerm OR user.email ILIKE :searchTerm OR user.phone ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` },
      );
    }

    // Filtro por rol
    if (roleId) {
      queryBuilder.andWhere('roles.id = :roleId', { roleId });
    }

    // Filtro por estado activo
    if (typeof isActive === 'boolean') {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    // Filtro por email verificado
    if (typeof isEmailVerified === 'boolean') {
      queryBuilder.andWhere('user.isEmailVerified = :isEmailVerified', {
        isEmailVerified,
      });
    }

    // Filtro por tener perfil
    if (typeof hasProfile === 'boolean') {
      if (hasProfile) {
        queryBuilder.andWhere('profile.id IS NOT NULL');
      } else {
        queryBuilder.andWhere('profile.id IS NULL');
      }
    }

    const total = await queryBuilder.getCount();

    const data = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getMany();

    const lastPage = Math.ceil(total / take);
    const hasNextPage = page < lastPage;
    const hasPrevPage = page > 1;

    return {
      data,
      meta: {
        total,
        page,
        lastPage,
        limit: take,
        hasNextPage,
        hasPrevPage,
      },
    };
  }

  /***************************** Buscar un usuario por ID ************************************ */
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        roles: true,
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException(
        `Usuario con ID ${id} no se ha encontrado o está inactivo.`,
      );
    }

    return user;
  }

  /***************************** Buscar un usuario por ID ************************************ */
  async findOneDeactive(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: false },
      relations: {
        roles: true,
        profile: true,
        buses: true,
        tickets: {
          trip: {
            route: {
              originCity: true,
              destinationCity: true,
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(
        `Usuario con ID ${id} no se ha encontrado o está activo.`,
      );
    }

    return user;
  }

  /******************************* Actualizar un usuario *********************************** */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const { roleId, password, email, phone, ...userData } = updateUserDto;

    // Verificar si el usuario existe
    const existingUser = await this.findOne(id);

    // Preparar los datos para actualizar
    const updateData: any = { ...userData };

    // Verificar email único si se está cambiando
    if (email && email !== existingUser.email) {
      await this.checkEmailUnique(email);
      updateData.email = email;
    }

    // Verificar phone único si se está cambiando
    if (phone && phone !== existingUser.phone) {
      await this.checkPhoneUnique(phone);
      updateData.phone = phone;
    }

    // Hash de nueva contraseña si se proporciona
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Actualizar rol si se proporciona
    if (roleId) {
      if (this.isUUID(roleId)) {
        // Si lo que recibo es un UUID
        updateData.roles = await this.findRoleOrThrow(roleId);
      } else {
        // Si lo que recibo es un nombre de rol
        const role = await this.roleRepository.findOne({
          where: { name: roleId },
        });
        if (!role) {
          throw new NotFoundException(`El rol '${roleId}' no existe`);
        }
        updateData.roles = role;
      }
    }

    await this.userRepository.save({
      id,
      ...updateData,
    });

    return this.findOne(id);
  }

  /************************ Cambiar estado activo ***************************/
  async toggleActive(id: string): Promise<User> {
    const user = await this.findOneDeactive(id);
    const active = await this.userRepository.update(id, {
      isActive: !user.isActive,
    });
    if (!active) {
      throw new NotFoundException(
        'La Id no existe o el usuario ya está activado',
      );
    }
    return this.findOne(id);
  }

  async toggleDeactive(id: string): Promise<User> {
    const user = await this.findOne(id);

    await this.userRepository.update(id, {
      isActive: false,
    });

    return this.findOne(id);
  }

  /*************************** Verificar email ************************************* */
  async verifyEmail(id: string): Promise<User> {
    await this.findOne(id);

    await this.userRepository.update(id, {
      isEmailVerified: true,
    });

    return this.findOne(id);
  }

  /*************************** Verificar teléfono ************************************* */
  async verifyPhone(id: string): Promise<User> {
    await this.findOne(id);

    await this.userRepository.update(id, {
      isPhoneVerified: true,
    });

    return this.findOne(id);
  }

  /******************************* Crear perfil para un usuario *********************************** */
  async createProfile(
    userId: string,
    profileData: Partial<UserProfile>,
  ): Promise<User> {
    const user = await this.findOne(userId);

    if (user.profile) {
      throw new BadRequestException('El usuario ya tiene un perfil asociado');
    }

    const profile = this.userProfileRepository.create(profileData);
    const savedProfile = await this.userProfileRepository.save(profile);

    await this.userRepository.update(userId, {
      profile: savedProfile,
    });

    return this.findOne(userId);
  }

  /*********************  Actualizar perfil de un usuario ************************************ */
  async updateProfile(
    userId: string,
    profileData: Partial<UserProfile>,
  ): Promise<User> {
    const user = await this.findOne(userId);

    if (!user.profile) {
      throw new NotFoundException('El usuario no tiene un perfil asignado');
    }

    await this.userProfileRepository.update(user.profile.id, profileData);

    return this.findOne(userId);
  }

  /****************************** Eliminar perfil de un usuario ************************************ */
  async removeProfile(userId: string): Promise<{ message: string }> {
    const user = await this.findOne(userId);

    if (!user.profile) {
      throw new NotFoundException('El usuario no tiene un perfil asignado');
    }

    const profileId = user.profile.id;

    // Desasociar primero
    await this.userRepository.update(userId, { profile: null });

    // Eliminar perfil
    await this.userProfileRepository.delete(profileId);

    return { message: `Perfil eliminado del usuario ${userId}` };
  }

  /****************************** Cambiar contraseña ************************************ */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // Obtener usuario con contraseña
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // Hash de la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Actualizar contraseña
    await this.userRepository.update(userId, {
      password: hashedNewPassword,
    });

    return { message: 'Contraseña cambiada exitosamente' };
  }

  /****************************** Obtener estadísticas del usuario ************************************ */
  async getUserStats(userId: string) {
    const user = await this.findOne(userId);

    const stats = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.tickets', 'tickets')
      .leftJoin('user.buses', 'buses')
      .select([
        'COUNT(DISTINCT tickets.ticket_id) as total_tickets',
        "COUNT(DISTINCT CASE WHEN tickets.status = 'CONFIRMED' THEN tickets.ticket_id END) as confirmed_tickets",
        'COUNT(DISTINCT buses.id) as total_buses',
        "SUM(CASE WHEN tickets.status = 'CONFIRMED' THEN tickets.price ELSE 0 END) as total_spent",
      ])
      .where('user.id = :userId', { userId })
      .getRawOne();

    return {
      user,
      statistics: {
        totalTickets: parseInt(stats.total_tickets) || 0,
        confirmedTickets: parseInt(stats.confirmed_tickets) || 0,
        totalBuses: parseInt(stats.total_buses) || 0,
        totalSpent: parseFloat(stats.total_spent) || 0,
        hasProfile: !!user.profile,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
      },
    };
  }

  /************************ DELETE ***************************/
  async remove(id: string): Promise<User> {
    const user = await this.findOne(id);

    // Verificar si tiene tickets confirmados o buses activos
    const activeTickets =
      user.tickets?.filter((ticket) => ticket.status === 'CONFIRMED') || [];

    const activeBuses = user.buses?.filter((bus) => bus.is_active) || [];

    if (activeTickets.length > 0 || activeBuses.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar un usuario que tiene tickets confirmados o buses activos',
      );
    }

    await this.userRepository.delete(id);

    return { ...user, isActive: false };

    ///////////////////////////////////////////////////////////////
  }
  // Métodos privados auxiliares
  private async findRoleOrThrow(roleId: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId, isActive: true },
    });

    if (!role) {
      throw new NotFoundException(
        `El rol con ID ${roleId} no existe o no está activo`,
      );
    }

    return role;
  }

  private async checkEmailUnique(email: string): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está en uso');
    }
  }

  private async checkPhoneUnique(phone: string): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      where: { phone },
    });

    if (existingUser) {
      throw new ConflictException('El teléfono ya está en uso');
    }
  }
  private isUUID(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}
