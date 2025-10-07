import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

// Función para configurar JWT usando ConfigService
export const jwtConfig = (configService: ConfigService): JwtModuleOptions => ({
  // Leer las variables de entorno usando ConfigService
  secret: configService.get<string>('JWT_SECRET'),
  // Configurar el tiempo de expiración del token
  signOptions: {
    // Si no está definido, por defecto '1d'
    expiresIn: configService.get<string>('JWT_EXPIRES_IN', 'id'),
  },
});
