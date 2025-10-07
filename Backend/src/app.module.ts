import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { CommonModule } from './common/common.module';
import { TicketsModule } from './modules/client/tickets/tickets.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/admin/user/user.module';
import { RoleModule } from './modules/admin/role/role.module';
import { UserProfileModule } from './modules/admin/user-profile/user-profile.module';
import { PermissionsModule } from './modules/admin/permissions/permissions.module';
import { BusModule } from './modules/client/bus/bus.module';
import { SeatModule } from './modules/client/seat/seat.module';
import { CityModule } from './modules/client/city/city.module';
import { RouteModule } from './modules/client/route/route.module';
import { TripModule } from './modules/client/trip/trip.module';
import { PaymentModule } from './modules/client/payment/payment.module';
import { ReportModule } from './modules/client/report/report.module';
import { NewsModule } from './modules/client/news/news.module';
import { SeatStacksModule } from './modules/client/seat-stacks/seat-stacks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: typeOrmConfig,
      inject: [ConfigService],
    }),
    CommonModule,
    UserModule,
    RoleModule,
    TicketsModule,
    AuthModule,
    UserProfileModule,
    PermissionsModule,
    BusModule,
    SeatModule,
    CityModule,
    RouteModule,
    TripModule,
    PaymentModule,
    ReportModule,
    NewsModule,
    SeatStacksModule,
  ],
})
export class AppModule {}
