import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadService } from './upload.service';
import { CloudinaryProvider } from 'src/config/cloudinary.config';

@Global() // ✅ Disponible en toda la app
@Module({
  imports: [ConfigModule],
  providers: [CloudinaryProvider, UploadService],
  exports: [UploadService],
})
export class UploadModule {}