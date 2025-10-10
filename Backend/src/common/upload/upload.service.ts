// src/common/upload/upload.service.ts
import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { v2 as Cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

export interface UploadOptions {
  folder?: string;
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'limit' | 'scale';
  quality?: 'auto' | number;
}

@Injectable()
export class UploadService {
  constructor(@Inject('CLOUDINARY') private readonly cloudinary: typeof Cloudinary) {}

  /**
   * Sube una imagen a Cloudinary desde un buffer
   * @param file - Archivo desde multer (Express.Multer.File)
   * @param options - Opciones de configuración
   * @returns URL pública de la imagen
   */
  async uploadImage(
    file: Express.Multer.File,
    options: UploadOptions = {}
  ): Promise<string> {
    // Validar tipo de archivo
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Solo se permiten imágenes (JPEG, PNG, WEBP)'
      );
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('La imagen no puede superar 5MB');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder: options.folder || 'bus-system',
          transformation: [
            {
              width: options.width || 800,
              height: options.height || 800,
              crop: options.crop || 'limit',
              quality: options.quality || 'auto',
              fetch_format: 'auto', // Optimiza formato automáticamente
            },
          ],
          resource_type: 'image',
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            reject(new BadRequestException(`Error al subir imagen: ${error.message}`));
          }
          if (result) {
            resolve(result.secure_url);
          }
        }
      );

      // Convertir buffer a stream y subir
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Sube múltiples imágenes
   * @param files - Array de archivos
   * @param options - Opciones de configuración
   * @returns Array de URLs
   */
  async uploadMultipleImages(
    files: Express.Multer.File[],
    options: UploadOptions = {}
  ): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se proporcionaron archivos');
    }

    if (files.length > 5) {
      throw new BadRequestException('Máximo 5 imágenes por vez');
    }

    const uploadPromises = files.map(file => this.uploadImage(file, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Elimina una imagen de Cloudinary
   * @param imageUrl - URL de la imagen a eliminar
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extraer public_id de la URL
      const publicId = this.extractPublicId(imageUrl);
      
      if (!publicId) {
        throw new BadRequestException('URL de imagen inválida');
      }

      await this.cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      // No lanzamos error para no bloquear operaciones críticas
    }
  }

  /**
   * Elimina múltiples imágenes
   * @param imageUrls - Array de URLs
   */
  async deleteMultipleImages(imageUrls: string[]): Promise<void> {
    const deletePromises = imageUrls.map(url => this.deleteImage(url));
    await Promise.allSettled(deletePromises);
  }

  /**
   * Extrae el public_id de una URL de Cloudinary
   * @param url - URL completa de Cloudinary
   * @returns public_id
   */
  private extractPublicId(url: string): string | null {
    try {
      const parts = url.split('/');
      const uploadIndex = parts.findIndex(part => part === 'upload');
      
      if (uploadIndex === -1) return null;
      
      // Obtener todo después de "upload/v{version}/"
      const pathAfterVersion = parts.slice(uploadIndex + 2).join('/');
      
      // Remover extensión
      return pathAfterVersion.replace(/\.[^/.]+$/, '');
    } catch {
      return null;
    }
  }

  /**
   * Obtiene URL optimizada para thumbnail
   * @param imageUrl - URL original
   * @param width - Ancho deseado
   * @param height - Alto deseado
   * @returns URL con transformaciones
   */
  getOptimizedUrl(imageUrl: string, width = 200, height = 200): string {
    if (!imageUrl) return '';
    
    try {
      const publicId = this.extractPublicId(imageUrl);
      if (!publicId) return imageUrl;

      return this.cloudinary.url(publicId, {
        transformation: [
          { width, height, crop: 'fill', quality: 'auto', fetch_format: 'auto' }
        ]
      });
    } catch {
      return imageUrl;
    }
  }
}