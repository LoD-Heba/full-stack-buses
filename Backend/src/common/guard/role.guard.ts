import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/role.decorator';
import { User } from 'src/modules/admin/user/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Extraer los roles requeridos de los metadatos
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      //ROLES_KEY, es la constante que define el decorador
      ROLES_KEY,
      //getHandler es el metodo, getClass es el controlador
      [context.getHandler(), context.getClass()],
    );

    // Si no se definieron roles, dejamos pasar
    if (!requiredRoles || requiredRoles.length === 0) return true;

    // Extraer el usuario de la request
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    // Log para debug
    console.log('Roles requeridos:', requiredRoles);

    // Preguntar si el usuario y su rol existen
    if (!user || !user.roles) {
      throw new ForbiddenException('No se encontró rol para el usuario');
    }

    // Verificar que el rol del usuario esté entre los roles permitidos
    const hasRole = requiredRoles.includes(user.roles.name);
    if (!hasRole) {
      throw new ForbiddenException('No tienes acceso a esa ruta');
    } 

    //Si hasRole encuentra el rol, retorna true
    return true;
  }
}
