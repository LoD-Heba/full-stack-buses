import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { News } from './entities/news.entity';
import { Repository } from 'typeorm';
import { User } from 'src/modules/admin/user/entities/user.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private readonly newsRepository: Repository<News>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createNewsDto: CreateNewsDto, file?: Express.Multer.File) {
    const { userIds, ...newsData } = createNewsDto;
    const user = await this.findUser(userIds);

    const newNews = this.newsRepository.create({
      ...newsData,
      user,
      image_url: file ? `/uploads/news/${file.filename}` : undefined,
    });
    
    return this.newsRepository.save(newNews);
  }

  findAll() {
    return this.newsRepository.find({
      where: { user: { isActive: true } },
      relations: { user: true },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<News> {
    const findNew = await this.newsRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    
    if (!findNew) {
      throw new NotFoundException('La id no existe');
    }
    
    return findNew;
  }

  async update(id: string, updateNewsDto: UpdateNewsDto, file?: Express.Multer.File) {
    const { userIds, ...newsData } = updateNewsDto;

    const existingNews = await this.newsRepository.findOne({
      where: { id },
      relations: { user: true },
    });

    if (!existingNews) {
      throw new NotFoundException(`Noticia con ID ${id} no encontrada`);
    }

    // Si se envía un nuevo archivo, eliminar el anterior
    if (file && existingNews.image_url) {
      this.deleteImage(existingNews.image_url);
    }

    // Actualizar usuario si se proporciona
    if (userIds !== undefined) {
      const user = await this.userRepository.findOneBy({ id: userIds });
      if (!user) {
        throw new NotFoundException(`Usuario con ID ${userIds} no encontrado`);
      }
      existingNews.user = user;
    }

    // Actualizar campos
    Object.assign(existingNews, newsData);
    
    // Actualizar imagen si se proporciona nueva
    if (file) {
      existingNews.image_url = `/uploads/news/${file.filename}`;
    }

    const updatedNews = await this.newsRepository.save(existingNews);

    return await this.newsRepository.findOne({
      where: { id: updatedNews.id },
      relations: { user: true },
    });
  }

  async remove(id: string) {
    const news = await this.findOne(id);
    
    // Eliminar imagen si existe
    if (news.image_url) {
      this.deleteImage(news.image_url);
    }
    
    return await this.newsRepository.delete(id);
  }

  ////////////////////Metodos auxiliares
  private async findUser(userIds: string): Promise<User> {
    const findUser = await this.userRepository.findOneBy({
      id: userIds,
      isActive: true,
    });
    
    if (!findUser)
      throw new NotFoundException('El usuario no existe o está inactivo');
      
    return findUser;
  }

  private deleteImage(imageUrl: string) {
    try {
      const imagePath = path.join(process.cwd(), imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
    }
  }
}