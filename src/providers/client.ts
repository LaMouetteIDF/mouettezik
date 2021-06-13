import { Injectable, Logger } from '@nestjs/common';

import { ClientEvents } from 'discord.js';

import { CommandoClient } from 'discord.js-commando';

@Injectable()
export class ClientProvider {
  private readonly logger = new Logger(ClientProvider.name);

  private client: CommandoClient;

  constructor() {
    this.client = new CommandoClient();
    this.client.on('ready', () =>
      this.logger.log('Connection to Discord is Ready!'),
    );

    this.client.once('disconnect', () => {
      this.logger.log('Disconnect to Discord!');
    });
    this.client.removeListener;
  }

  getDiscordClient(): CommandoClient {
    return this.client;
  }

  addListener<K extends keyof ClientEvents>(
    event: K,
    listener: (...args: ClientEvents[K]) => void,
  ) {
    this.client.on(event, listener);
  }

  removeListener(event: string | symbol, listener: (...args: any[]) => void) {
    this.client.removeListener(event, listener);
  }

  connect(token: string) {
    this.client.login(token);
  }
}
