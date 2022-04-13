import { Injectable } from '@nestjs/common';
import { Collection } from 'discord.js';

import { PlayerManager } from './player.manager';
import { CommonService } from '../common.service';
import { View } from 'core/player/View';
import { playerViewMessageResponse } from 'utils/view/player';

@Injectable()
export class ViewManager {
  constructor(
    private readonly coreService: CommonService,
    private readonly playerManager: PlayerManager,
  ) {}

  private _views = new Collection<string, View>();

  get views() {
    return this._views;
  }

  async new(playerId: string, channelId: string) {
    const player = this.playerManager.players.get(playerId);
    if (!player) throw new Error('no player');

    const channel = await this.coreService.client.channels.fetch(channelId);
    if (!channel) throw new Error('no found channel');
    if (!channel.isText()) throw new Error('is not a text channel');

    const message = await channel.send(playerViewMessageResponse(player.state));

    const view = new View(
      this.coreService,
      {
        id: message.id,
        guildId: message.guildId,
        channelId: channel.id,
        playerId: player.id,
        timestamp: Date.now(),
      },
      player,
      message,
    );
    this._register(view);
  }

  private _register(view: View) {
    void this._views
      .filter(
        ({ state: { channelId, playerId } }) =>
          view.state.channelId === channelId &&
          view.state.playerId === playerId,
      )
      .forEach((view) => view.destroy());

    this._views.set(view.id, view);

    view.once('destroy', (data) => {
      this._views.delete(data.id);
    });
  }
}
