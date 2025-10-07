import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permission.decorator';
import { User } from 'src/modules/admin/user/entities/user.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Extraer los permisos requeridos de los metadatos
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()], // Importante el orden
    );

    // Si la ruta no tiene permisos definidos, dejamos pasar
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    // Extraer el usuario de la request
    const request = context.switchToHttp().getRequest();
    // Se asume que el JwtAuthGuard ya se ejecutó antes que este guard
    const user: User = request.user;

    console.log('Permisos necesarios:', requiredPermissions);
    console.log('Usuario:', user?.email, 'Rol:', user?.roles?.name);

    // Verificar que el usuario y su rol existan
    if (!user || !user.roles) {
      throw new ForbiddenException('No se encontró rol para el usuario');
    }

    // Extraemos los permisos del rol del usuario
    // const userPermissions = user.roles.permissions.map(p => p.name);
    // console.log('Permisos del usuario:', userPermissions);

    // Verificamos que tenga TODOS los permisos requeridos
    // every -> todos los elementos cumplen la condicion
    //includes -> verifica si un elemento existe en un array
    // const hasAllPermissions = requiredPermissions.every(p => userPermissions.includes(p));

    // Verificamos que tenga al menos un permiso requerido 
    // if (!hasAllPermissions) {
    //   console.log(`Usuario ${user.email} no tiene permisos suficientes`);
    //   throw new ForbiddenException(
    //     `No tienes los permisos necesarios. Requeridos: ${requiredPermissions.join(', ')}`,
    //   );
    // }

    return true;
  } 
}
