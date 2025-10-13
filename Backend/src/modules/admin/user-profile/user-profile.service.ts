import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
    private readonly ticketRepository: Repository<Ticket>
  ) {}

  async create(createUserProfileDto: CreateUserProfileDto): Promise<UserProfile> {
    // Validar documentNumber único si se proporciona
    if (createUserProfileDto.documentNumber) {
      const exists = await this.userProfileRepository.findOne({
        where: { documentNumber: createUserProfileDto.documentNumber }
      });
      
      if (exists) {
        throw new ConflictException(
          `Ya existe un cliente con el C.I. ${createUserProfileDto.documentNumber}`
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
      isGuest: true // Solo clientes invitados (sin cuenta de usuario)
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
      }
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
      relations: ['trip', 'trip.route', 'trip.route.originCity', 'trip.route.destinationCity', 'trip.bus', 'seat'],
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
    if (updateUserProfileDto.documentNumber && updateUserProfileDto.documentNumber !== userProfile.documentNumber) {
      const exists = await this.userProfileRepository.findOne({
        where: { documentNumber: updateUserProfileDto.documentNumber }
      });
      
      if (exists) {
        throw new ConflictException(
          `Ya existe un cliente con el C.I. ${updateUserProfileDto.documentNumber}`
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
}