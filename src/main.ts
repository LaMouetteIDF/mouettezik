import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { generateDependencyReport } from '@discordjs/voice';
import { NestExpressApplication } from '@nestjs/platform-express';
// import { join } from 'path';

console.log(generateDependencyReport());

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // app.useStaticAssets(join(__dirname, '..', 'public'));
  // app.setBaseViewsDir(join(__dirname, '..', 'views'));
  // app.setViewEngine('hbs');

  app.setGlobalPrefix('api');

  app.enableShutdownHooks();

  await app.listen(3000);
}

bootstrap();
