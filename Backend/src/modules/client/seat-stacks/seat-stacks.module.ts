import { Module } from '@nestjs/common';
import { SeatStacksService } from './seat-stacks.service';
import { SeatStacksController } from './seat-stacks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bus } from '../bus/entities/bus.entity';
import { Seat } from '../seat/entities/seat.entity';
import { SharedModule } from 'src/common/shared/shared.module';
import { SeatStack } from './entities/seat-stack.entity';

@Module({
  imports:([TypeOrmModule.forFeature([Bus, Seat, SeatStack]), SharedModule]),
  controllers: [SeatStacksController],
  providers: [SeatStacksService],
  exports: [SeatStacksService],
})
export class SeatStacksModule {}
