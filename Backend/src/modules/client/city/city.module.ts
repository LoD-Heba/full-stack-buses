import { Module } from '@nestjs/common';
import { CityService } from './city.service';
import { CityController } from './city.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Route } from '../route/entities/route.entity';
import { SharedModule } from 'src/common/shared/shared.module';
import { City } from './entities/city.entity';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    TypeOrmModule.forFeature([Route, City]),
    MulterModule.register({
      dest: './uploads/cities',
    }),
    SharedModule,
  ],
  controllers: [CityController],
  providers: [CityService],
  exports: [CityService],
})
export class CityModule {}
