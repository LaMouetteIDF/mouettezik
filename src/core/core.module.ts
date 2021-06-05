import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreService } from './core.service';
import { CommandsModule } from '@/commands/commands.module';
import { ClientModule } from '@/client/client.module';

@Module({
  imports: [ConfigModule, CommandsModule, ClientModule],
  providers: [CoreService],
})
export class CoreModule {}
