import { Message } from 'discord.js';

import { IEventRunner } from 'core/abstract/IEventRunner';
import { IViewData } from 'core/entities/IViewData';
import { PlayerStatus } from 'core/enums/PlayerStatus';

import { CommonService } from 'common/common.service';

import { Player } from './Player';

import { playerViewMessageResponse } from 'utils/view/player';

type InternalViewState = IViewData & {
  message: Message;
};

export type ViewState = InternalViewState & {
  view: View;
};

type ViewEvents = {
  stateChange: (oldState: ViewState, newState: ViewState) => void;
  destroy: (data: IViewData) => void;
};

export class View extends IEventRunner<ViewState, ViewEvents> {
  private _updateTick: NodeJS.Timeout;

  constructor(
    private core: CommonService,
    data: IViewData,
    player: Player,
    message: Message,
  ) {
    if (!player.voice) throw new Error('player not running');

    super();
    this._player = player;

    this._state = {
      ...data,
      message,
    };

    player.on('stateChange', this._onPlayerStateChange);
    this.once('destroy', () => {
      player.removeListener('stateChange', this._onPlayerStateChange);
    });

    this._updateView().catch();
  }

  private _destroyed: boolean;

  get destroyed() {
    return this._destroyed;
  }

  private _state: InternalViewState;

  get state(): ViewState {
    return {
      ...this._state,
      view: this,
    };
  }

  get id() {
    return this.state.id;
  }

  private _player: Player;

  get player() {
    return this._player;
  }

  public destroy() {
    this._destroy();
  }

  private async _updateView() {
    if (this.destroyed) return;

    const state = this._player.state;
    const res = playerViewMessageResponse(state);

    if (state.status === PlayerStatus.Play) {
      if (!this._updateTick)
        this._updateTick = setInterval(() => this._updateView(), 10_000);

      if (this._destroyTimer) {
        clearTimeout(this._destroyTimer);
        delete this._destroyTimer;
      }
    } else {
      clearInterval(this._updateTick);
      delete this._updateTick;
    }

    if (state.status === PlayerStatus.Stop) {
      clearTimeout(this._destroyTimer);

      this._destroyTimer = setTimeout(() => {
        this._destroy();
      }, 30 * 60 * 1_000);
    }

    try {
      await this._state.message.edit(res);
    } catch (e) {
      console.error(e);
    }
  }

  private _destroyTimer: NodeJS.Timeout;

  private _destroy() {
    if (this._destroyed) return;

    this._destroyed = true;

    clearInterval(this._updateTick);
    delete this._updateTick;

    clearTimeout(this._destroyTimer);
    delete this._destroyTimer;

    const { message, ...data } = this._state;

    message.delete().catch(console.warn);
    delete this._state.message;

    this.emit('destroy', data);
  }

  private _onPlayerStateChange = async () => {
    try {
      await this._updateView();
    } catch (e) {
      console.error(e);
    }
  };
}
