import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SQLiteProvider } from 'discord.js-commando';
import * as sqlite from 'sqlite3';
import * as sql from 'sqlite';

import { ClientProvider } from '@/providers/client';
import { CommandsService } from '@/commands/commands.service';
import { YtPlayer } from '@/services/player/yt-player';
import { Youtube } from '@/services/download/youtube';

@Injectable()
export class CoreService implements OnModuleInit {
  private readonly logger = new Logger(CoreService.name);

  constructor(
    private clientProvider: ClientProvider,
    private commandsService: CommandsService,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    this.logger.log('Start Discord bot!');
    this.run();
  }

  getDB() {
    return sql.open({
      filename: this.configService.get('DATABASE'),
      driver: sqlite.cached.Database,
    });
  }

  async run() {
    // START TEST COMMANDO

    const client = this.clientProvider.getDiscordClient();

    const provider = new SQLiteProvider(await this.getDB());

    const youtube = new Youtube();

    await provider.init(client);

    client.setProvider(provider);

    client.youtube = youtube;
    client.music = new YtPlayer(youtube, provider);

    this.commandsService.register(client);

    // END TEST COMMANDO

    const token = this.configService.get('TOKEN');
    this.clientProvider.connect(token);
  }
}
