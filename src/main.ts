import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// import { generateDependencyReport } from '@discordjs/voice';

// console.log(generateDependencyReport());

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  app.enableShutdownHooks();

  await app.init();
}

bootstrap();
