import { Module } from '@nestjs/common';
import { BusService } from './bus.service';
import { BusController } from './bus.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Seat } from '../seat/entities/seat.entity';
import { Trip } from '../trip/entities/trip.entity';
import { Route } from '../route/entities/route.entity';
import { User } from 'src/modules/admin/user/entities/user.entity';
import { SharedModule } from 'src/common/shared/shared.module';
import { Bus } from './entities/bus.entity';
import { SeatStack } from '../seat-stacks/entities/seat-stack.entity';

@Module({
  imports:([TypeOrmModule.forFeature([Bus, Seat, Trip, Route, User, SeatStack]), SharedModule]),
  controllers: [BusController],
  providers: [BusService],
  exports: [BusService],
})
export class BusModule {}
