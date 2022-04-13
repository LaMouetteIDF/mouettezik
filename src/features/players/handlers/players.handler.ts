import { Injectable } from '@nestjs/common';

import { HandleCommand, Handler } from 'core/decorators';
import { PlayerRepeat } from 'core/enums/PlayerRepeat';
import { CommandRequest } from 'core/request/CommandRequest';

import { ViewManager } from 'common/managers/view.manager';

import { PlayersService } from '../services/players.service';

const VOICE_CHANNEL_ERROR = new Error('Please join a voice channel!');

const INVALID_URL = new Error('invalid url');

@Injectable()
@Handler()
export class PlayersHandler {
  constructor(
    private readonly playersService: PlayersService,
    private readonly playerViewManager: ViewManager,
  ) {}

  @HandleCommand('play')
  async playCommand(req: CommandRequest): Promise<string> {
    const userVoiceChannel = await req.userVoiceChannel();

    if (!userVoiceChannel) throw VOICE_CHANNEL_ERROR;

    const { id: playerId } = userVoiceChannel;

    const url = req.raw.options.getString('url', false);

    if (url) {
      try {
        new URL(url);
      } catch (e) {
        throw INVALID_URL;
      }

      await req.defer;

      void (await this.playersService.playFromURL(playerId, url));

      this.playerViewManager.new(playerId, req.raw.channelId).catch();

      return 'play!';
    }

    const resumed = this.playersService.resumePlayer(playerId);

    if (resumed) return 'resume !';

    await req.defer;

    const track = await this.playersService.playCurrent(playerId);

    return `play track: ${track.title ?? 'no title'}`;
  }

  @HandleCommand('pause')
  async pauseCommand(req: CommandRequest): Promise<string> {
    const userVoiceChannel = await req.userVoiceChannel();

    if (!userVoiceChannel) throw VOICE_CHANNEL_ERROR;

    const { id: playerId } = userVoiceChannel;

    const paused = this.playersService.pausePlayer(playerId);

    if (!paused) return 'player not playing';

    return 'pause music';
  }

  @HandleCommand('next')
  async nextCommand(req: CommandRequest): Promise<string> {
    const userVoiceChannel = await req.userVoiceChannel();

    if (!userVoiceChannel) throw VOICE_CHANNEL_ERROR;

    const { id: playerId } = userVoiceChannel;

    await req.defer;

    void (await this.playersService.nextTrack(playerId));

    return `Next track!`;
  }

  @HandleCommand('previous')
  async previousCommand(req: CommandRequest): Promise<string> {
    const userVoiceChannel = await req.userVoiceChannel();

    if (!userVoiceChannel) throw VOICE_CHANNEL_ERROR;

    const { id: playerId } = userVoiceChannel;

    await req.defer;

    void (await this.playersService.previousTrack(playerId, true));

    return `Previous track!`;
  }

  @HandleCommand('stop')
  async stopCommand(req: CommandRequest): Promise<string> {
    const userVoiceChannel = await req.userVoiceChannel();

    if (!userVoiceChannel) throw VOICE_CHANNEL_ERROR;

    const { id: playerId } = userVoiceChannel;

    const stopped = this.playersService.stopPlayer(playerId);

    if (!stopped) return 'Player has already stopped';

    return 'Stop!';
  }

  @HandleCommand('repeat')
  async repeatCommand(req: CommandRequest): Promise<string> {
    const userVoiceChannel = await req.userVoiceChannel();

    if (!userVoiceChannel) throw VOICE_CHANNEL_ERROR;

    const { id: playerId } = userVoiceChannel;

    const repeatMode = req.raw.options.getString('mode', true);

    switch (repeatMode) {
      case PlayerRepeat.None:
      case PlayerRepeat.All:
      case PlayerRepeat.One:
        this.playersService.setRepeat(playerId, repeatMode);
        return `Repeat mode: "${repeatMode}"`;
      default:
        return 'Invalid params';
    }
  }
}
