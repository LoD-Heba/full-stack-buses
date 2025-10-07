import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from 'src/common/guard/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Login con email o teléfono
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Registro público
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // Obtener usuario actual (requiere autenticación)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Request() req) {
    return this.authService.getCurrentUser(req.user.sub);
  }

  // Refrescar token (requiere autenticación)
  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refreshToken(@Request() req) {
    return this.authService.refreshToken(req.user.sub);
  }

  // Logout (opcional)
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req) {
    return this.authService.logout(req.user.sub);
  }

  // Validar credenciales para cambio de contraseña
  @Post('validate-password')
  @UseGuards(JwtAuthGuard)
  async validatePassword(
    @Request() req,
    @Body('currentPassword') currentPassword: string
  ) {
    const isValid = await this.authService.validateCredentialsForPasswordChange(
      req.user.sub,
      currentPassword
    );
    
    return { isValid };
  }
}