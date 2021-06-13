import { Injectable } from '@nestjs/common';
import { CommandoClient, CommandoRegistry } from 'discord.js-commando';

import { Play } from './music/play';
import { Pause } from './music/pause';
import { Next } from './music/next';
import { Stop } from './music/stop';
import { Kill } from './music/kill';
import { ClientProvider } from '@/providers/client';

export const MusicCommands = [Play, Pause, Next, Stop, Kill];

@Injectable()
export class CommandsService {
  constructor(private clientProvider: ClientProvider) {}

  register(client: CommandoClient) {
    client.registry
      .registerDefaults()
      .registerGroups([['music', 'Musique']])
      .registerCommands([Play, Stop]);
  }
}
