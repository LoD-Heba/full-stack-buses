import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { UserProfile } from './entities/user-profile.entity';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Ticket } from 'src/modules/client/tickets/entities/ticket.entity';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,

    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async create(
    createUserProfileDto: CreateUserProfileDto,
  ): Promise<UserProfile> {
    // Validar documentNumber único si se proporciona
    if (createUserProfileDto.documentNumber) {
      const exists = await this.userProfileRepository.findOne({
        where: { documentNumber: createUserProfileDto.documentNumber },
      });

      if (exists) {
        throw new ConflictException(
          `Ya existe un cliente con el C.I. ${createUserProfileDto.documentNumber}`,
        );
      }
    }

    if (createUserProfileDto.email) {
      const exists = await this.userProfileRepository.findOne({
        where: { email: createUserProfileDto.email },
      });

      if (exists) {
        throw new ConflictException(
          `Ya existe un cliente con el email ${createUserProfileDto.email}`,
        );
      }
    }

    // Crear perfil como invitado (sin usuario asociado)
    const userProfile = this.userProfileRepository.create({
      ...createUserProfileDto,
      isGuest: true, // Marcar como invitado
      isActive: true,
    });

    return this.userProfileRepository.save(userProfile);
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const offset = (page - 1) * limit;

    const whereConditions: any = {
      isGuest: true, // Solo clientes invitados (sin cuenta de usuario)
    };

    // Búsqueda por nombre, apellido o documento

    const [data, total] = await this.userProfileRepository.findAndCount({
      where: whereConditions,
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<UserProfile> {
    const userProfile = await this.userProfileRepository.findOne({
      where: { id },
    });

    if (!userProfile) {
      throw new NotFoundException(`Cliente con id ${id} no encontrado`);
    }

    return userProfile;
  }

  async findOneWithTickets(id: string) {
    const userProfile = await this.userProfileRepository.findOne({
      where: { id },
    });

    if (!userProfile) {
      throw new NotFoundException(`Cliente con id ${id} no encontrado`);
    }

    // Obtener tickets del cliente
    const tickets = await this.ticketRepository.find({
      where: { user: { id } },
      relations: [
        'trip',
        'trip.route',
        'trip.route.originCity',
        'trip.route.destinationCity',
        'trip.bus',
        'seat',
      ],
      order: { booking_date: 'DESC' },
    });

    return {
      ...userProfile,
      tickets,
    };
  }

  async update(
    id: string,
    updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<UserProfile> {
    const userProfile = await this.findOne(id);

    // Validar documentNumber único si se está actualizando
    if (
      updateUserProfileDto.documentNumber &&
      updateUserProfileDto.documentNumber !== userProfile.documentNumber
    ) {
      const exists = await this.userProfileRepository.findOne({
        where: { documentNumber: updateUserProfileDto.documentNumber },
      });

      if (exists) {
        throw new ConflictException(
          `Ya existe un cliente con el C.I. ${updateUserProfileDto.documentNumber}`,
        );
      }
    }

    if (
      updateUserProfileDto.email &&
      updateUserProfileDto.email !== userProfile.email
    ) {
      const exists = await this.userProfileRepository.findOne({
        where: { email: updateUserProfileDto.email },
      });

      if (exists) {
        throw new ConflictException(
          `Ya existe un cliente con el email ${updateUserProfileDto.email}`,
        );
      }
    }

    Object.assign(userProfile, updateUserProfileDto);
    return this.userProfileRepository.save(userProfile);
  }

  async remove(id: string): Promise<void> {
    const userProfile = await this.findOne(id);

    await this.userProfileRepository.remove(userProfile);
  }

  async toggleActive(id: string): Promise<UserProfile> {
    const userProfile = await this.findOne(id);
    userProfile.isActive = !userProfile.isActive;
    return this.userProfileRepository.save(userProfile);
  }

  // Método para verificar si un cliente puede comprar tickets
  async canPurchaseTickets(id: string): Promise<boolean> {
    const userProfile = await this.findOne(id);

    return !!(
      userProfile.firstName &&
      userProfile.lastName &&
      userProfile.documentNumber &&
      userProfile.isActive
    );
  }

  /**
 * Busca un perfil por documento o teléfono
 * Útil para verificar si un cliente ya está registrado
 */
async findByDocumentOrPhone(
  documentNumber?: string,
  phone?: string,
): Promise<UserProfile | null> {
  if (!documentNumber && !phone) {
    return null;
  }

  const whereConditions: any[] = [];

  if (documentNumber) {
    whereConditions.push({ documentNumber: documentNumber.trim().toUpperCase() });
  }

  if (phone) {
    // Limpiar teléfono de espacios y guiones
    const cleanPhone = phone.replace(/[\s\-]/g, '').trim();
    whereConditions.push({ phone: cleanPhone });
  }

  if (whereConditions.length === 0) {
    return null;
  }

  const profile = await this.userProfileRepository.findOne({
    where: whereConditions,
    relations: ['user'], // Incluir relación con usuario si existe
  });

  return profile || null;
}

/**
 * Busca perfil y devuelve información relevante
 * Sin exponer datos sensibles innecesarios
 */
async searchProfile(identifier: string): Promise<{
  exists: boolean;
  profile?: Partial<UserProfile>;
}> {
  // Detectar si es documento o teléfono
  const isPhone = /^(\+\d{1,4})?[\s\-]?\d{6,15}$/.test(identifier);
  const isDocument = /^\d{7,10}(-[0-9A-Za-z]{1,3})?$/.test(identifier);

  let profile: UserProfile | null = null;

  if (isDocument) {
    profile = await this.findByDocumentOrPhone(identifier, undefined);
  } else if (isPhone) {
    const cleanPhone = identifier.replace(/[\s\-]/g, '').trim();
    profile = await this.findByDocumentOrPhone(undefined, cleanPhone);
  } else {
    return { exists: false };
  }

  if (!profile) {
    return { exists: false };
  }

  // Devolver solo datos necesarios (sin exponer todo)
  return {
    exists: true,
    profile: {
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      documentNumber: profile.documentNumber,
      phone: profile.phone,
      email: profile.email,
      address: profile.address,
      isGuest: profile.isGuest,
    },
  };
}

/**
 * Crear o actualizar perfil según existencia
 */
async createOrUpdate(
  createUserProfileDto: CreateUserProfileDto,
): Promise<UserProfile> {
  // Buscar perfil existente
  const existingProfile = await this.findByDocumentOrPhone(
    createUserProfileDto.documentNumber,
    createUserProfileDto.phone,
  );

  if (existingProfile) {
    // Actualizar perfil existente con nuevos datos
    return this.update(existingProfile.id, createUserProfileDto);
  }

  // Si no existe, crear nuevo
  return this.create(createUserProfileDto);
}
  
}
