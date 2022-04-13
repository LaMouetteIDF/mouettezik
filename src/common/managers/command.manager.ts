import { Injectable } from '@nestjs/common';
import { SlashCommandBuilder } from '@discordjs/builders';

import { CommonService } from '../common.service';

@Injectable()
export class CommandManager {
  private _schemas: SlashCommandBuilder[] = [];

  constructor(private readonly coreService: CommonService) {
    coreService.client.once('ready', () => {
      if (this._schemas.length) {
        this._registerCommandSchemas(this._schemas).catch(console.warn);
      }
    });
  }

  private get client() {
    return this.coreService.client;
  }

  registerSchemas(...schemas: SlashCommandBuilder[]) {
    if (this.client.isReady()) {
      this._registerCommandSchemas(schemas).catch(console.warn);
    } else this._schemas.push(...schemas);
  }

  private async _registerCommandSchemas(schemas: SlashCommandBuilder[]) {
    const guilds = await this.coreService.client.guilds
      .fetch()
      .catch(console.warn);
    if (guilds)
      for (const oAuth2Guild of guilds.values()) {
        try {
          const guild = await oAuth2Guild.fetch();
          const commands = schemas.map((command) => command.toJSON());
          await guild.commands.set(commands);
        } catch (e) {
          console.warn(e);
        }
      }
  }
}
