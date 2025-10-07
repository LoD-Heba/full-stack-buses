import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { User } from '../user/entities/user.entity';
import { SharedModule } from 'src/common/shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, User]), SharedModule],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
