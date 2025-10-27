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
  // CAMBIO: Habilitar rawBody para webhooks
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  const logger = new Logger(AppModule.name);
  const configService = app.get(ConfigService);

  // Crear carpeta uploads con ruta ABSOLUTA
  const uploadsPath = join(process.cwd(), 'uploads');
  const citiesPath = join(uploadsPath, 'cities');
  const busesPath = join(uploadsPath, 'buses');
  const newsPath = join(uploadsPath, 'news');

  [uploadsPath, citiesPath, busesPath, newsPath].forEach((path) => {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
      logger.log(`✅ Carpeta creada: ${path}`);
    }
  });

  logger.log(`📂 Ruta de uploads: ${uploadsPath}`);

  // Global prefix desde .env
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // ✅ CAMBIO: Configurar webhook de Stripe ANTES de otros middlewares
  app.use(
    `/${apiPrefix}/stripe/webhook`,
    bodyParser.raw({ type: 'application/json' })
  );

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
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
  });

  // Servir archivos estáticos con ruta ABSOLUTA
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads',
    maxAge: '1d',
  });

  const port = +configService.get<string>('PORT', '3001');
  await app.listen(port);

  logger.log(`✅ Servidor iniciado en http://localhost:${port}/${apiPrefix}`);
  logger.log(`📂 Archivos estáticos: http://localhost:${port}/uploads`);
  logger.log(`💳 Webhook Stripe: http://localhost:${port}/${apiPrefix}/stripe/webhook`);
  logger.log(`📁 CWD: ${process.cwd()}`);
}
bootstrap();