import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from '../admin/user/entities/user.entity';
import { UserService } from '../admin/user/user.service';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  JwtPayload,
  LoginResponse,
  UserProfile,
} from './interfaces/auth.interfaces';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  /********************************************************************** */
  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { identifier, password } = loginDto;

    // Buscar el usuario por email o teléfono
    const user = await this.findUserForAuth(identifier);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar que el usuario esté activo
    if (!user.isActive) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Comparar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.generateAuthResponse(user);
  }

  /********************************************************************** */
  async register(registerDto: RegisterDto): Promise<LoginResponse> {
    // Usar el servicio de usuario para registrar
    const user = await this.userService.register(registerDto);

    return this.generateAuthResponse(user);
  }

  /********************************************************************** */
  // Método para generar la respuesta de autenticación
  private generateAuthResponse(user: User): LoginResponse {
  // CAMBIAR para obtener email y phone del perfil:
  const identifier = user.profile?.email || user.profile?.phone || '';
  const identifierType: 'email' | 'phone' = user.profile?.email ? 'email' : 'phone';

  const payload: JwtPayload = {
    sub: user.id,
    identifier,
    identifierType,
    role: user.roles.name,
  };

  const accessToken = this.jwtService.sign(payload);
  const expiresIn = this.getTokenExpirationInSeconds();

  const userProfile: UserProfile = {
    id: user.id,
    name: user.name,
    email: user.profile?.email,
    phone: user.profile?.phone,
    // ELIMINAR isEmailVerified e isPhoneVerified si no los tienes en UserProfile entity
    // O cambiarlos a profile.isEmailVerified si los agregas allí
    isEmailVerified: false, // TODO: mover a profile entity
    isPhoneVerified: false, // TODO: mover a profile entity
    role: user.roles.name,
  };

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: expiresIn,
    user: userProfile,
  };
}

  /********************************************************************** */
  // Método para obtener el usuario actual desde el token JWT
  async getCurrentUser(userId: string): Promise<Partial<User>> {
  const user = await this.userRepository.findOne({
    where: { id: userId, isActive: true },
    relations: { roles: true, profile: true },
    select: {
      id: true,
      name: true,
      isActive: true,
      createdAt: true,
      profile: {
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        documentNumber: true,
        address: true,
      }
    },
  });

  if (!user) {
    throw new UnauthorizedException('Usuario no encontrado');
  }

  return user;
}
  /********************************************************************** */
  // Método para refrescar el token
  async refreshToken(userId: string): Promise<LoginResponse> {
  const user = await this.userRepository.findOne({
    where: { id: userId, isActive: true },
    relations: { roles: true, profile: true }, // AGREGAR profile
    select: {
      id: true,
      name: true,
      // ELIMINAR email y phone
      password: true,
      isActive: true,
      profile: { // AGREGAR select del profile
        email: true,
        phone: true,
      },
      roles: {
        id: true,
        name: true,
      },
    },
  });
  
  if (!user) {
    throw new UnauthorizedException('Usuario no encontrado');
  }
  
  return this.generateAuthResponse(user);
}

  /********************************************************************** */
  // Método para logout (opcional - depende de tu implementación)
  async logout(userId: string): Promise<{ message: string }> {
    // Aquí podrías invalidar el token si usas una blacklist
    // Por ahora, simplemente retornamos un mensaje
    return { message: 'Logout exitoso' };
  }

  /********************************************************************** */
  // Validar credenciales para cambio de contraseña
  async validateCredentialsForPasswordChange(
    userId: string,
    currentPassword: string,
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
      select: ['id', 'password'],
    });

    if (!user) {
      return false;
    }

    return bcrypt.compare(currentPassword, user.password);
  }

  /********************************************************************** */
  // Método privado para generar tiempo de expiración en segundos
  private getTokenExpirationInSeconds(): number {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '1d');

    if (expiresIn.endsWith('h')) {
      return parseInt(expiresIn) * 3600;
    }
    if (expiresIn.endsWith('m')) {
      return parseInt(expiresIn) * 60;
    }
    if (expiresIn.endsWith('d')) {
      return parseInt(expiresIn) * 86400;
    }

    return parseInt(expiresIn) || 3600; // por defecto 3600 segundos (1 hora)
  }

  /********************************************************************** */
  // Método privado para encontrar un usuario por email o teléfono
  // CAMBIAR completamente el método:
private async findUserForAuth(identifier: string): Promise<User | null> {
  // Detectar si el identificador es email o teléfono
  const isEmail = identifier.includes('@');

  // Buscar usuario que tenga un perfil con ese email o phone
  return this.userRepository
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.roles', 'roles')
    .leftJoinAndSelect('user.profile', 'profile')
    .where('user.isActive = :isActive', { isActive: true })
    .andWhere(
      isEmail 
        ? 'profile.email = :identifier' 
        : 'profile.phone = :identifier',
      { identifier }
    )
    .select([
      'user.id',
      'user.name',
      'user.password',
      'user.isActive',
      'profile.email',
      'profile.phone',
      'roles.id',
      'roles.name'
    ])
    .getOne();
}
}
