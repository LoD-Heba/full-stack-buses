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
import { JwtPayload, LoginResponse, UserProfile } from './interfaces/auth.interfaces';

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
    // Determinar el identificador principal y su tipo
    const identifier = user.email || user.phone || '';
    const identifierType: 'email' | 'phone' = user.email ? 'email' : 'phone';

    const payload: JwtPayload = {
      sub: user.id,
      identifier,
      identifierType,
      role: user.roles.name,
    };

    // Generar el token de acceso
    const accessToken = this.jwtService.sign(payload);

    // Obtener el tiempo de expiración del token en segundos
    const expiresIn = this.getTokenExpirationInSeconds();

    // Crear el perfil del usuario para la respuesta
    const userProfile: UserProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
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
  async getCurrentUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
      relations: { 
        roles: true, 
        profile: true 
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
    const user = await this.getCurrentUser(userId);
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
    currentPassword: string
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
      select: ['id', 'password']
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
  private async findUserForAuth(identifier: string): Promise<User | null> {
    // Detectar si el identificador es email o teléfono
    const isEmail = identifier.includes('@');
    
    const whereCondition = isEmail 
      ? { email: identifier, isActive: true }
      : { phone: identifier, isActive: true };

    return this.userRepository.findOne({
      where: whereCondition,
      relations: { roles: true },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        password: true,
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        roles: { 
          id: true, 
          name: true 
        },
      },
    });
  }
}