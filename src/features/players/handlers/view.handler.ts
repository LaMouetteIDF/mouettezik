import { Injectable } from '@nestjs/common';
import { channelMention } from '@discordjs/builders';

import { HandleButton, Handler } from 'core/decorators';

import { PlayerRepeat } from 'core/enums/PlayerRepeat';
import { ButtonRequest } from 'core/request/ButtonRequest';

import { PlayersService } from '../services/players.service';

const errorVoice = (channelId: string) =>
  new Error(`Please join ${channelMention(channelId)} !`);

@Injectable()
@Handler()
export class ViewHandler {
  constructor(private readonly playerService: PlayersService) {}

  @HandleButton('play')
  async play(req: ButtonRequest) {
    if (!(await this._checkUserVoiceChannel(req))) return;
    const resumed = this.playerService.resumePlayer(req.playload);
    if (resumed) return 'resumed!';

    await req.defer;
    await this.playerService.playCurrent(req.playload);
    return `Play!`;
  }

  @HandleButton('pause')
  async pause(req: ButtonRequest) {
    if (!(await this._checkUserVoiceChannel(req))) return;
    return this.playerService.pausePlayer(req.playload)
      ? 'Pause!'
      : 'Player no playing';
  }

  @HandleButton('next')
  async next(req: ButtonRequest) {
    if (!(await this._checkUserVoiceChannel(req))) return;

    await req.defer;
    await this.playerService.nextTrack(req.playload);

    return `Next track !`;
  }

  @HandleButton('previous')
  async previous(req: ButtonRequest) {
    if (!(await this._checkUserVoiceChannel(req))) return;

    await req.defer;
    await this.playerService.previousTrack(req.playload);

    return `Previous track !`;
  }

  @HandleButton('stop')
  async stop(req: ButtonRequest) {
    if (!(await this._checkUserVoiceChannel(req))) return;
    return this.playerService.stopPlayer(req.playload)
      ? 'Stopped!'
      : 'Player already stopped';
  }

  @HandleButton('repeat')
  async setRepeat(req: ButtonRequest) {
    if (!(await this._checkUserVoiceChannel(req))) return;
    let newRepeatState: PlayerRepeat;

    switch (req.raw.component.style) {
      case 'SUCCESS':
        newRepeatState = PlayerRepeat.None;
        break;
      case 'PRIMARY':
        newRepeatState = PlayerRepeat.One;
        break;
      case 'SECONDARY':
        newRepeatState = PlayerRepeat.All;
        break;
      default:
        throw new Error('invalid button');
    }
    await this.playerService.setRepeat(req.playload, newRepeatState);

    return `Repeat mode: "${newRepeatState}"`;
  }

  private async _checkUserVoiceChannel(req: ButtonRequest) {
    if (!req.playload) return false;
    try {
      const userVoiceChannel = await req.userVoiceChannel();
      const player = this.playerService.getPlayer(req.playload);
      if (!userVoiceChannel || userVoiceChannel.id !== player.id) {
        req.sendError(errorVoice(player.channelId)).catch(() => '');
        return false;
      }
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
}
