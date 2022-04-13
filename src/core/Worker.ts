import { Client } from 'discord.js';

import { IWorkerRuntime } from 'core/abstract/IWorkerRuntime';

import { CommonService } from 'common/common.service';

export class Worker extends IWorkerRuntime {
  constructor(public readonly core: CommonService, client: Client) {
    super(client);
    core.registerWorker(this);
  }

  public get client() {
    return this.core.client;
  }

  async inGuild(guildId: string): Promise<boolean> {
    try {
      const guild = await this.client.guilds.fetch(guildId);
      const worker = await guild.members.fetch(this.conn.user.id);
      return !!worker;
    } catch (e) {
      return false;
    }
  }

  async getGuildMember(guildId: string) {
    const guild = await this.client.guilds.fetch(guildId);
    return await guild.members.fetch(this.id);
  }

  async getVoiceAdapter(guildId: string) {
    const guild = await this.raw.guilds.fetch(guildId);
    return guild?.voiceAdapterCreator;
  }
}
