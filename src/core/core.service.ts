import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sqlite from 'sqlite3';
import * as sql from 'sqlite';

import { ClientProvider } from '@/providers/client';
import { CommandsService } from '@/commands/commands.service';
import path from 'path';
import { SQLiteProvider } from 'discord.js-commando';
import { YtPlayer } from '@/services/player/yt-player';
import { Youtube } from '@/services/download/youtube';

const dbProm = sql.open({
  filename: '/tmp/database.sqlite',
  driver: sqlite.cached.Database,
});

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

  async run() {
    // START TEST COMMANDO

    const client = this.clientProvider.getDiscordClient();

    // const pathDB = path.join(`${__dirname}/sqlite`, 'database.sqlite3');

    const db = await dbProm;

    // db.run('CREATE TABLE settings (guild INTEGER PRIMARY KEY, settings TEXT)');

    const provider = new SQLiteProvider(db);
    // console.log(db);

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
