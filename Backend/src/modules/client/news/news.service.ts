import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { News } from './entities/news.entity';
import { Repository } from 'typeorm';
import { User } from 'src/modules/admin/user/entities/user.entity';
import { UserProfile } from 'src/modules/admin/user-profile/entities/user-profile.entity';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private readonly newsRepository: Repository<News>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createNewsDto: CreateNewsDto) {
    const { userIds, ...newsData } = createNewsDto;
    const user = await this.findUser(userIds);

    const newNews = this.newsRepository.create({
      ...newsData,
      user,
    });
    return this.newsRepository.save(newNews);
  }

  findAll() {
    const getNews = this.newsRepository.find({
      where: { user: { isActive: true } },
      relations: { user: true },
      order: { created_at: 'DESC' },
    });
    return getNews;
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

async update(id: string, updateNewsDto: UpdateNewsDto) {
  const { userIds, ...newsData } = updateNewsDto;

  // 1. Buscar la noticia existente (y cargar su usuario actual si existe)
  const existingNews = await this.newsRepository.findOne({
    where: { id },
    relations: { user: true }, // ← Carga la relación para mostrarla después
  });

  if (!existingNews) {
    throw new NotFoundException(`Noticia con ID ${id} no encontrada`);
  }

  // 2. Si se envía userIds, actualizar la relación
  if (userIds !== undefined) {
    const user = await this.userRepository.findOneBy({ id: userIds });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userIds} no encontrado`);
    }
    existingNews.user = user; 
  }

  // 3. Actualizar los demás campos
  Object.assign(existingNews, newsData); 

  // 4. Guardar y devolver con la relación cargada
  const updatedNews = await this.newsRepository.save(existingNews);

  // 5. Volver a cargar la relación para asegurar que se incluya en la respuesta
  return await this.newsRepository.findOne({
    where: { id: updatedNews.id },
    relations: { user: true },
  });
}

  async remove(id: string) {
    await this.findOne(id)
    const deleteNew = await this.newsRepository.delete(id)
    return deleteNew
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
}
