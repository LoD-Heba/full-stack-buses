import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Role } from '../role/entities/role.entity';
import { SharedModule } from 'src/common/shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([Permission, Role]), SharedModule],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
