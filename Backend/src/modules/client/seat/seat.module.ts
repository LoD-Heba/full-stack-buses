import { Module } from '@nestjs/common';
import { SeatService } from './seat.service';
import { SeatController } from './seat.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bus } from '../bus/entities/bus.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { SharedModule } from 'src/common/shared/shared.module';
import { SeatStack } from '../seat-stacks/entities/seat-stack.entity';
import { Seat } from './entities/seat.entity';
import { Trip } from '../trip/entities/trip.entity';

@Module({
  imports:([TypeOrmModule.forFeature([Seat, Bus, Ticket, SeatStack, Trip]), SharedModule]),
  controllers: [SeatController],
  providers: [SeatService],
  exports: [SeatService]
})
export class SeatModule {}
