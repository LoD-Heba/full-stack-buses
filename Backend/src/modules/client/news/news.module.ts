import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/admin/user/entities/user.entity';
import { SharedModule } from 'src/common/shared/shared.module';
import { News } from './entities/news.entity';

@Module({
  imports: ([TypeOrmModule.forFeature([User, News]), SharedModule]),
  controllers: [NewsController],
  providers: [NewsService],
  exports: [NewsService]
})
export class NewsModule {}
