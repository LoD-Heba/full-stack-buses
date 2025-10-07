import { Module } from '@nestjs/common';
import { CityService } from './city.service';
import { CityController } from './city.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Route } from '../route/entities/route.entity';
import { SharedModule } from 'src/common/shared/shared.module';
import { City } from './entities/city.entity';

@Module({
  imports:([TypeOrmModule.forFeature([Route, City]), SharedModule]),
  controllers: [CityController],
  providers: [CityService],
  exports: [CityService]
})
export class CityModule {}
