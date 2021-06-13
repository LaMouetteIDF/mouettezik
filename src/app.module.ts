import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreService } from './core/core.service';
import { ClientProvider } from './providers/client';
import { CommandsService } from './commands/commands.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [],
  providers: [CoreService, ClientProvider, CommandsService],
})
export class AppModule {}
