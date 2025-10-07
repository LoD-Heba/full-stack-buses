import { Module } from '@nestjs/common';
import { UserProfileService } from './user-profile.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfile } from './entities/user-profile.entity';
import { UserProfileController } from './user-profile.controller';
import { User } from '../user/entities/user.entity';
import { SharedModule } from 'src/common/shared/shared.module';
import { Ticket } from 'src/modules/client/tickets/entities/ticket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserProfile, User, Ticket]), SharedModule],
  controllers: [UserProfileController],
  providers: [UserProfileService],
  exports: [UserProfileService],
})
export class UserProfileModule {}
