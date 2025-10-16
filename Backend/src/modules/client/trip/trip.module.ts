import { Module } from '@nestjs/common';
import { TripService } from './trip.service';
import { TripController } from './trip.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bus } from '../bus/entities/bus.entity';
import { Route } from '../route/entities/route.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { SharedModule } from 'src/common/shared/shared.module';
import { Trip } from './entities/trip.entity';
import { UserProfile } from 'src/modules/admin/user-profile/entities/user-profile.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { Seat } from '../seat/entities/seat.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bus, Route, Ticket, Trip, UserProfile, Seat]),
    SharedModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [TripController],
  providers: [TripService],
  exports: [TripService],
})
export class TripModule {}
