import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/admin/user/entities/user.entity';
import { SharedModule } from 'src/common/shared/shared.module';
import { Report } from './entities/report.entity';

@Module({
  imports:([TypeOrmModule.forFeature([User, Report]), SharedModule]),
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService]
})
export class ReportModule {}
