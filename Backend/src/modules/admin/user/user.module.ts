import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfile } from '../user-profile/entities/user-profile.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from 'src/common/guard/auth.guard';
import { Bus } from 'src/modules/client/bus/entities/bus.entity';
import { News } from 'src/modules/client/news/entities/news.entity';
import { Report } from 'src/modules/client/report/entities/report.entity';
import { Ticket } from 'src/modules/client/tickets/entities/ticket.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, UserProfile, Bus, News, Report, Ticket]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
    }),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [UserController],
  providers: [UserService, JwtAuthGuard],
  exports: [UserService, JwtAuthGuard], // Exportar el servicio para usarlo en otros módulos
})
export class UserModule {}
