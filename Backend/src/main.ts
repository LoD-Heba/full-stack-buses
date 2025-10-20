import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { join } from 'path';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger(AppModule.name);
  const configService = app.get(ConfigService);

  // Crear carpeta uploads con ruta ABSOLUTA
  const uploadsPath = join(process.cwd(), 'uploads');
  const citiesPath = join(uploadsPath, 'cities');
  
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    logger.log(`✅ Carpeta creada: ${uploadsPath}`);
  }
  
  if (!fs.existsSync(citiesPath)) {
    fs.mkdirSync(citiesPath, { recursive: true });
    logger.log(`✅ Carpeta creada: ${citiesPath}`);
  }

  logger.log(`📂 Ruta de uploads: ${uploadsPath}`);

  // Global prefix desde .env
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: false,
      validationError: { target: false, value: false },
      transform: true,
    }),
  );

  // CORS mejorado
  const clientUrl = configService.get<string>('CLIENT_URL', 'http://localhost:3000');
  app.enableCors({
    origin: clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Servir archivos estáticos con ruta ABSOLUTA
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads',
    maxAge: '1d',
  });

  // Body parser para webhooks
  app.use('/payments/webhook', bodyParser.raw({ type: 'application/json' }));

  const port = +configService.get<string>('PORT', '3001');
  await app.listen(port);

  logger.log(`✅ Servidor iniciado en http://localhost:${port}/${apiPrefix}`);
  logger.log(`📂 Archivos estáticos: http://localhost:${port}/uploads`);
  logger.log(`📁 CWD: ${process.cwd()}`);
}
bootstrap();