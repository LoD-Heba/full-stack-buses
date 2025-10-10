import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    private readonly tickedRepository : Repository <Ticket>
  ) {}

  async create(createUserProfileDto: CreateUserProfileDto): Promise<UserProfile> {
  // Validar documentNumber único
  if (createUserProfileDto.documentNumber) {
    const exists = await this.userProfileRepository.findOne({
      where: { documentNumber: createUserProfileDto.documentNumber }
    });
    
    if (exists) {
      throw new ConflictException(
        `Ya existe un perfil con el C.I. ${createUserProfileDto.documentNumber}`
      );
    }
  }
  
  const userProfile = this.userProfileRepository.create(createUserProfileDto);
  return this.userProfileRepository.save(userProfile);
}

  async findAll(paginationDto: PaginationDto) {
    // Desestructurar y establecer valores predeterminados para paginación
    const { page = 1, limit = 5 } = paginationDto;
    const offset = (page - 1) * limit;

    // Consulta con paginación
    return await this.userProfileRepository.find({
      where: { isActive: true, user: { isActive: true } },
      relations: { user: true },
      order: { createdAt: 'DESC' },
      skip: offset, // Desplazamiento para paginación
      take: limit, // Límite de resultados por página
    });
  }

  async findOne(id: string): Promise<UserProfile> {
    const userProfile = await this.userProfileRepository.findOne({
      where: { id },
    });
    if (!userProfile) {
      throw new NotFoundException(`UserProfile with id ${id} not found`);
    }
    return userProfile;
  }

  async update(
    id: string,
    updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<UserProfile> {
    const userProfile = await this.findOne(id); // valida si existe
    Object.assign(userProfile, updateUserProfileDto);
    return this.userProfileRepository.save(userProfile);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userProfileRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`UserProfile with id ${id} not found`);
    }
  }
}
