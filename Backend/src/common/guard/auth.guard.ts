import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/modules/admin/user/entities/user.entity';
import { JwtPayload } from 'src/modules/auth/interfaces/auth.interfaces';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extraer el token de la cabecera
    const token = this.extractTokenFromHeader(request);

    // Preguntar si el token existe, si no existe lanza una excepcion
    if (!token) throw new UnauthorizedException('Token not found');

    // Valida el token
    try {
      // Verifica el token y obtiene el payload
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      // Traer el usuario completo con role y perfil
      const user = await this.userRepository.findOne({
        //me aseguro que el usuario este activo
        where: { id: payload.sub, isActive: true },
        //me aseguro que el usuario tenga un rol y perfil
        relations: { roles: true, profile: true },
      });

      // Preguntar si el usuario existe
      if (!user) throw new UnauthorizedException('User not found');

      // Incluir el usuario en la request
      request['user'] = user; // importante

      // Si todo esta bien, retorna true
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  // Metodo para extraer el token de la cabecera
  private extractTokenFromHeader(request: Request) {
    // Separo el Bearer del token
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
