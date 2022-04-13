import { Module, OnModuleInit } from '@nestjs/common';

import { CommonModule } from 'common/common.module';
import { CommandManager } from 'common/managers/command.manager';

import { PlayersHandler } from './handlers/players.handler';
import { ViewHandler } from './handlers/view.handler';
import { QueueHandler } from './handlers/queue.handler';

import { PlayersService } from './services/players.service';

import { PlayersCommandSchemas } from './handlers/schemas';

@Module({
  imports: [CommonModule],
  providers: [PlayersService, PlayersHandler, QueueHandler, ViewHandler],
})
export class PlayersModule implements OnModuleInit {
  constructor(private readonly commandManager: CommandManager) {}

  onModuleInit() {
    this.commandManager.registerSchemas(...PlayersCommandSchemas);
  }
}
