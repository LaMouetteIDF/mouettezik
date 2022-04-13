import { Injectable } from '@nestjs/common';

import { ITrackData } from 'core/entities/ITrackData';
import { IResourceBase } from 'core/abstract/IResourceBase';
import { PlayerRepeat } from 'core/enums/PlayerRepeat';

import { getResourceByURL } from 'core/resource';
import { Playlist } from 'core/resource/Playlist';
import { Track } from 'core/resource/Track';

import { Player } from 'core/player/Player';

import { PlayerManager } from 'common/managers/player.manager';
import { VoicesManager } from 'common/managers/voices.manager';
import { CommonService } from 'common/common.service';

const NO_PLAYER = new Error('no player');

@Injectable()
export class PlayersService {
  constructor(
    private readonly coreService: CommonService,
    private readonly playerManager: PlayerManager,
    private readonly voiceManager: VoicesManager,
  ) {}

  public getPlayer(id: string): Player | undefined {
    return this.playerManager.players.get(id);
  }

  public async playFromURL(
    playerId: string,
    url: string,
  ): Promise<Playlist | Track> {
    const resource = await getResourceByURL(url);
    return await this.playFromResource(playerId, resource);
  }

  public async playFromResource(
    playerId: string,
    resource: IResourceBase,
  ): Promise<Playlist | Track> {
    await resource.fetch();

    const player = await this.playerManager.get(playerId);

    if (!player.voice) {
      const voice = await this.voiceManager.newVoice(playerId);
      player.subscribe(voice);
    }

    if (resource.isPlaylist()) {
      const data = resource.getMetaData();
      const playlist = Playlist.from(data);
      await player.play(playlist);
      return player.state.playlist;
    } else if (resource.isTrack()) {
      const data = resource.getMetaData();
      const track = Track.from(data);
      await player.play(track);
      return player.state.current;
    } else throw new Error('internal error');
  }

  public async playCurrent(playerId: string): Promise<ITrackData> {
    const player = this.playerManager.players.get(playerId);
    if (!player) throw NO_PLAYER;

    if (!player.voice) {
      const voice = await this.voiceManager.newVoice(playerId);
      player.subscribe(voice);
    }

    await player.play();
    return player.state.current;
  }

  public pausePlayer(playerId: string): boolean {
    const player = this.playerManager.players.get(playerId);
    if (!player) throw NO_PLAYER;
    return player.pause();
  }

  public resumePlayer(playerId: string): boolean {
    const player = this.playerManager.players.get(playerId);
    if (!player) throw NO_PLAYER;
    return player.resume();
  }

  public async nextTrack(playerId: string): Promise<ITrackData> {
    const player = this.playerManager.players.get(playerId);
    if (!player) throw NO_PLAYER;

    if (!player.voice) {
      const voice = await this.voiceManager.newVoice(playerId);
      player.subscribe(voice);
    }

    await player.next();
    return player.state.current;
  }

  public async previousTrack(
    playerId: string,
    force = false,
  ): Promise<ITrackData> {
    const player = this.playerManager.players.get(playerId);
    if (!player) throw NO_PLAYER;

    if (!player.voice) {
      const voice = await this.voiceManager.newVoice(playerId);
      player.subscribe(voice);
    }

    await player.previous(force);
    return player.state.current;
  }

  public stopPlayer(playerId: string): boolean {
    const player = this.playerManager.players.get(playerId);
    if (!player) throw NO_PLAYER;
    return player.stop();
  }

  public setRepeat(playerId: string, mode: PlayerRepeat) {
    const player = this.playerManager.players.get(playerId);
    if (!player) throw NO_PLAYER;
    player.setRepeat(mode);
  }
}
