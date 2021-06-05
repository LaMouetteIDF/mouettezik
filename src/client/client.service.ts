import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Message, ClientEvents } from 'discord.js';
import { EnvironmentalVariables } from 'src/utils/constants';

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);

  private readonly client = new Client();

  constructor(private configService: ConfigService) {
    this.client.once('ready', () => {
      this.logger.log('Connection to Discord is Ready!');
    });

    this.client.once('reconnecting', () => {
      this.logger.log('Reconnecting to Discord!');
      console.log('Reconnecting!');
    });

    this.client.once('disconnect', () => {
      this.logger.log('Disconnect!');
    });
    this.client.login(this.configService.get(EnvironmentalVariables.BOT_TOKEN));
  }

  addEventListener<K extends keyof ClientEvents>(
    event: K,
    cb: (...args: ClientEvents[K]) => void,
  ) {
    this.client.on(event, cb);
  }
}
