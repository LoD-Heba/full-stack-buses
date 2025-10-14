import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { createMulterOptions } from 'src/config/upload.config';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image', createMulterOptions('news')))
  create(
    @Body() createNewsDto: CreateNewsDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.newsService.create(createNewsDto, file);
  }

  @Get()
  findAll() {
    return this.newsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.newsService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', createMulterOptions('news')))
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateNewsDto: UpdateNewsDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.newsService.update(id, updateNewsDto, file);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.newsService.remove(id);
  }
}