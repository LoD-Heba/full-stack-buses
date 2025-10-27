import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from '../tickets/entities/ticket.entity';
import { SharedModule } from 'src/common/shared/shared.module';
import { Payment } from './entities/payment.entity';
import { UserProfile } from 'src/modules/admin/user-profile/entities/user-profile.entity'; // ✅ AGREGAR

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, Payment, UserProfile]), 
    SharedModule
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService]
})
export class PaymentModule {}