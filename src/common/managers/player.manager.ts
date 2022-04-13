import { Injectable } from '@nestjs/common';
import { Collection } from 'discord.js';

import { CommonService } from '../common.service';
import { Player } from 'core/player/Player';
import { PlayerStatus } from 'core/enums/PlayerStatus';
import { PlayerRepeat } from 'core/enums/PlayerRepeat';

@Injectable()
export class PlayerManager {
  constructor(private readonly coreService: CommonService) {}

  private _players = new Collection<string, Player>();

  get players() {
    return this._players;
  }

  get core() {
    return this.coreService;
  }

  async get(channelId: string) {
    const player = this._players.get(channelId);
    return player ?? (await this._newPlayer(channelId));
  }

  private async _newPlayer(channelId: string) {
    if (!(await this.coreService.isVoiceChannel(channelId)))
      throw new Error('is not voice channel');

    const channel = await this.core.client.channels.fetch(channelId);
    if (!channel.isVoice()) return;

    const player = new Player({
      id: channel.id,
      guildId: channel.guildId,
      channelId: channel.id,
      status: PlayerStatus.Stop,
      queue: [],
      repeat: PlayerRepeat.None,
      allPlayingTime: 0,
    });

    return this._register(player);
  }

  private _register(player: Player) {
    if (this._players.has(player.id))
      throw new Error('player has already exist');

    this._players.set(player.id, player);

    return player;
  }
}
