import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger(AppModule.name);
  const configService = app.get(ConfigService);

  //Excepciones globales de validacion de datos
  //app.useGlobalFilters(new AllExceptionsFilter);

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
    }),
  );

  //Iniciar servidor
  app.enableCors({
    origin: 'http://localhost:3000', // puerto de Next.js
    credentials: true,
  }); // ← Permite peticiones desde Next.js (puerto 3001)
  
  const port = +configService.get<string>('PORT', '3001');
  await app.listen(port);

  //Log de inicio
  logger.log(` Servidor iniciado en http://localhost:${port}/${apiPrefix}`);
}
bootstrap();
