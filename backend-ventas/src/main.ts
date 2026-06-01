import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔥 ESTO ES LO QUE TE FALTABA
  app.enableCors({
    origin: '*',
  });

  await app.listen(3001);
}

bootstrap();