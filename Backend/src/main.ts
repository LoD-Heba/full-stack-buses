import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { join } from 'path';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger(AppModule.name);
  const configService = app.get(ConfigService);

   
  //global prefix desde .env
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  //habilitar carpeta publica
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: false,
      validationError: { target: false, value: false },
      transform: true,
    }),
  );

  //Iniciar servidor
  app.enableCors({
    origin: 'http://localhost:3000', // puerto de Next.js
    credentials: true,
  }); 
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });
  app.use('/payments/webhook', bodyParser.raw({ type: 'application/json' }));
  const port = +configService.get<string>('PORT', '3001');
  await app.listen(port);

  logger.log(` Servidor iniciado en http://localhost:${port}/${apiPrefix}`);
}
bootstrap();
