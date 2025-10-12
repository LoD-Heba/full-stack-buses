import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from '../trip/entities/trip.entity';
import { Seat } from '../seat/entities/seat.entity';
import { Payment } from '../payment/entities/payment.entity';
import { SharedModule } from 'src/common/shared/shared.module';
import { Ticket } from './entities/ticket.entity';
import { TicketController } from './tickets.controller';
import { TicketService } from './tickets.service';
import { UserProfile } from 'src/modules/admin/user-profile/entities/user-profile.entity';
import { User } from 'src/modules/admin/user/entities/user.entity';
import { TripModule } from '../trip/trip.module';

@Module({
  imports: ([TypeOrmModule.forFeature([Trip, Seat, Payment, Ticket, UserProfile, User]), SharedModule,TripModule,]),
  controllers: [TicketController],
  providers: [TicketService],
  exports: [TicketService]
})
export class TicketsModule {}
