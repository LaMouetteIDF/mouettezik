import { Worker } from '@/features/bot/worker/worker';
import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  joinVoiceChannel,
  PlayerSubscription,
  VoiceConnection,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { InternalDiscordGatewayAdapterCreator } from 'discord.js';
import { PlaylistService } from '@/features/bot/playlist/playlist.service';
import { TrackEntity } from '@/infra/entities/track.entity';

export enum VoiceStatus {
  Idle,
  Play,
  Pause,
  Stop,
}

export type VoiceState = {
  status: VoiceStatus;
  playlist?: {
    id: string;
    currentTrack: string;
  };
};

export class Voice {
  private readonly _state: VoiceState;
  private subscription: PlayerSubscription;
  private _guildVoiceAdaptor: InternalDiscordGatewayAdapterCreator;

  private _currentTrack?: TrackEntity;
  private _queue: TrackEntity[] = [];
  private _loop: 'ALL' | 'ONE' | undefined;
  private _playlist?: {
    id: string;
    currentTrack: string;
    trackOrder: string[];
  };

  constructor(
    private readonly _guildId: string,
    private _channelId: string,
    private readonly _worker: Worker,
    private readonly playlistService: PlaylistService,
  ) {
    this._state = {
      status: VoiceStatus.Idle,
    };
  }

  get state(): VoiceState {
    return { ...this._state };
  }

  /**
   * @readonly
   */
  get workerId(): string {
    return this._worker.id;
  }

  /**
   * @readonly
   */
  get channelId(): string {
    return this._channelId;
  }

  get playlist(): string | undefined {
    return this._state.playlist.id;
  }

  get track(): string | undefined {
    return this._state.playlist.currentTrack;
  }

  private _newVoiceConnection(): VoiceConnection {
    return joinVoiceChannel({
      guildId: this._guildId,
      channelId: this._channelId,
      group: this.workerId,
      adapterCreator: this._guildVoiceAdaptor,
    });
  }

  /**
   * Get or make new voice connection
   * @private
   */
  private _voiceConnection(): VoiceConnection {
    let connection = getVoiceConnection(this._guildId, this.workerId);
    if (
      !connection ||
      [
        VoiceConnectionStatus.Destroyed,
        VoiceConnectionStatus.Disconnected,
      ].includes(connection.state.status)
    )
      connection = this._newVoiceConnection();
    return connection;
  }

  /**
   * Get current or make new audio player
   * @private
   */
  private _audioPlayer(): AudioPlayer {
    if (this.subscription?.player) return this.subscription.player;
    const connection = this._voiceConnection();
    const audioPlayer = createAudioPlayer();
    const subscription = connection.subscribe(audioPlayer);
    if (!subscription) throw new Error('error on subscribe audio player');
    this.subscription = subscription;
    audioPlayer.on('error', (error) => {
      console.log('PLAYER ERROR !!!');
      console.error(error);
    });
    audioPlayer.on(AudioPlayerStatus.Idle, this.onAudioPlayerIdle.bind(this));
    return subscription.player;
  }

  private async _audioResource(track: TrackEntity) {
    const directUrl = await this.playlistService.getDirectUrl(track);
    return createAudioResource(directUrl, {
      metadata: {
        worker: this._worker.id,
        guild: this._guildId,
        channel: this._channelId,
        track: {
          id: track.id,
          playlistId: track.playlistId,
          title: track.title,
          duration: track.duration,
          isAvailable: track.isAvailable,
        },
      },
    });
  }

  private async _setCurrentPlaylist(playlistId: string, trackIndex = 1) {
    const playlist = await this.playlistService.getPlaylist(playlistId);
    if (!playlist) {
      console.log('no playlist found, stop playing!');
      return;
    } else if (playlist.tracksOrder.length == 0) {
      console.log('no track found in playlist, stop playing!');
      return;
    }
    const trackId = playlist.tracksOrder[trackIndex - 1];
    if (!trackId) throw new Error('no track found in playlist');
    const trackEntity = await this.playlistService.getTrack(trackId);
    if (!trackEntity) throw new Error('no track found in playlist database');
    this._currentTrack = trackEntity;
    this._playlist = {
      id: playlist.id,
      currentTrack: trackEntity.id,
      trackOrder: playlist.tracksOrder.slice(),
    };
  }

  private async _playPlaylist(playlistId: string, trackIndex = 1) {
    await this._setCurrentPlaylist(playlistId, trackIndex);
    await this._playCurrentTrack();
  }

  private async _playCurrentTrack() {
    await this._fetchVoiceAdaptor();
    const audioPlayer = this._audioPlayer();
    if (!this._currentTrack.isAvailable) return this.onAudioPlayerIdle();
    audioPlayer.play(await this._audioResource(this._currentTrack));
    this._state.status = VoiceStatus.Play;
  }

  private async _nextTrack() {
    if (this._queue && this._queue.length > 0) {
      this._currentTrack = this._queue.shift();
      await this._playCurrentTrack();
      return;
    }

    if (this._playlist) {
      const playlist = await this.playlistService.getPlaylist(
        this._playlist.id,
      );

      if (!playlist || playlist.tracksOrder.length == 0) {
        if (!playlist) delete this._playlist;
        this.stop();
        return;
      }

      let nextTrackId: string;

      const currentTrackId = this._playlist.currentTrack;
      const currentTrackIndex = playlist.tracksOrder.indexOf(currentTrackId);

      if (currentTrackIndex >= 0) {
        nextTrackId = playlist.tracksOrder[currentTrackIndex + 1];

        if (!nextTrackId && this._loop === 'ALL')
          nextTrackId = playlist.tracksOrder[0];
        else this.stop();
      } else {
        const mapTracks = this._playlist.trackOrder.filter((trackId) =>
          playlist.tracksOrder.includes(trackId),
        );

        if (mapTracks.length > 0) {
          const oldTrackOrder = this._playlist.trackOrder.slice();
          const newTrackOrder = playlist.tracksOrder.slice();
          let previousTrackIdInLoop: string;

          const ok = mapTracks.every((trackId) => {
            if (
              oldTrackOrder.indexOf(trackId) <
              oldTrackOrder.indexOf(this._playlist.currentTrack)
            ) {
              previousTrackIdInLoop = trackId;
              return true;
            } else {
              if (!previousTrackIdInLoop) {
                nextTrackId = trackId;
                return false;
              } else {
                nextTrackId =
                  newTrackOrder[
                    newTrackOrder.indexOf(previousTrackIdInLoop) + 1
                  ];

                if (!nextTrackId) return this._playPlaylist(this._playlist.id); // LIRE LA PLAYLIST DEPUIS LE DEBUT !!!
              }
            }
          });

          if (ok) return this._playPlaylist(this._playlist.id); // LIRE LA PLAYLIST DEPUIS LE DEBUT !!!
        } else return this._playPlaylist(this._playlist.id); // LIRE LA PLAYLIST DEPUIS LE DEBUT !!!
      }
      if (!nextTrackId) return this._playPlaylist(this._playlist.id);
      const nextTrack = await this.playlistService.getTrack(nextTrackId);
      if (!nextTrack) return this._playPlaylist(this._playlist.id);
      this._playlist.currentTrack = nextTrack.id;
      this._playlist.trackOrder = playlist.tracksOrder.slice();
      this._currentTrack = nextTrack;
      return this._playCurrentTrack();
    }

    this.stop();
  }

  private async _fetchVoiceAdaptor() {
    if (!this._guildVoiceAdaptor)
      this._guildVoiceAdaptor = await this._worker.getGuildVoiceAdaptor(
        this._guildId,
      );
  }

  private async onAudioPlayerIdle() {
    if (this._state.status !== VoiceStatus.Play) return;
    return await this._nextTrack();
  }

  public async play() {
    if (this._state.status === VoiceStatus.Play) return;

    if (
      this._state.status === VoiceStatus.Idle ||
      this._state.status === VoiceStatus.Stop
    ) {
      if (this._currentTrack) return await this._playCurrentTrack();
      else if (this._queue.length > 0) return this._nextTrack();
    }

    if (this.subscription.player.unpause())
      this._state.status = VoiceStatus.Play;
  }

  public async playTrack(track: TrackEntity) {
    this._currentTrack = track;
    await this._playCurrentTrack();
  }

  public pause() {
    if (this._state.status === VoiceStatus.Pause) return true;
    if (this._state.status === VoiceStatus.Idle) return false;
    const audioPlayer = this.subscription.player;
    if (!audioPlayer) return false;
    const ok = audioPlayer.pause(true);
    if (!ok) return false;
    this._state.status = VoiceStatus.Pause;
    return true;
  }

  public stop() {
    if ([VoiceStatus.Idle, VoiceStatus.Stop].indexOf(this._state.status) >= 0)
      return true;
    const audioPlayer = this.subscription.player;
    if (!audioPlayer) return false;
    const ok = audioPlayer.stop();
    if (!ok) return false;
    this._state.status = VoiceStatus.Stop;
    return true;
  }

  public async setPlaylist(playlistId: string, track = 1) {
    const playlist = await this.playlistService.getPlaylist(playlistId);
    if (!playlist) throw new Error('no playlist playlist');
    if (playlist.tracksOrder.length === 0)
      throw new Error('no track found in playlist');
    if (track && playlist.tracksOrder.length < track)
      throw new Error(`track n°${track} no found in playlist`);
    if (this._state.status !== VoiceStatus.Idle)
      await this._playPlaylist(playlistId, track);
  }

  public addInQueue(track: TrackEntity) {
    this._queue.push(track);
  }

  public destroy() {
    this._state.status = VoiceStatus.Idle;
    this.subscription?.player?.stop(true);
    this.subscription?.connection?.disconnect();

    delete this.subscription;
    delete this._guildVoiceAdaptor;
  }

  public async init() {
    return this;
  }
}
