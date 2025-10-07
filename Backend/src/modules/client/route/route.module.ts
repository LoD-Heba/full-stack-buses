import { Module } from '@nestjs/common';
import { RouteService } from './route.service';
import { RouteController } from './route.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { City } from '../city/entities/city.entity';
import { Bus } from '../bus/entities/bus.entity';
import { Trip } from '../trip/entities/trip.entity';
import { SharedModule } from 'src/common/shared/shared.module';
import { Route } from './entities/route.entity';

@Module({
  imports: ([TypeOrmModule.forFeature([City, Bus, Trip, Route]), SharedModule]),
  controllers: [RouteController],
  providers: [RouteService],
  exports: [RouteService]
})
export class RouteModule {}
