import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Collection } from 'discord.js';

import type { Worker } from 'core/Worker';

@Injectable()
export class CommonService implements OnModuleInit {
  private readonly _client: Client;

  constructor(private readonly configService: ConfigService) {
    this._client = new Client<boolean>({
      intents: [
        'GUILDS',
        'GUILD_VOICE_STATES',
        'GUILD_MEMBERS',
        'GUILD_INTEGRATIONS',
      ],
    });
  }

  private _workers = new Collection<string, Worker>();

  public get workers() {
    return this._workers;
  }

  get client() {
    return this._client;
  }

  registerWorker(worker: Worker) {
    this._workers.set(worker.id, worker);
  }

  async getUserVoiceChannel(
    guildId: string,
    userId: string,
  ): Promise<string | undefined> {
    try {
      const guild = await this.client.guilds.fetch(guildId);
      const guildMember = await guild.members.fetch(userId);
      return guildMember.voice.channelId ?? undefined;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }

  async isVoiceChannel(channelId: string) {
    try {
      const channel = await this.client.channels.fetch(channelId);
      return channel.isVoice();
    } catch (_) {
      return false;
    }
  }

  async onModuleInit() {
    // return;
    const clientToken = this.configService
      .get<string>('KSPLAYER_CLIENT_TOKEN')
      ?.trim()
      .replaceAll('"', '');

    if (!clientToken) {
      console.error('KSPLAYER_CLIENT_TOKEN env not found');
      process.exit(1);
    }

    try {
      await this.client.login(clientToken);
    } catch (e) {
      if (e.code == 'TOKEN_INVALID') {
        console.error('Invalid client token!');
      } else console.error(e);

      process.exit(1);
      throw new Error('invalid token');
    }

    console.log(`${this.client.user.tag} loaded!`);
  }
}
