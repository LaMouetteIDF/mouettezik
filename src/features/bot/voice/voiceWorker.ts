import { Worker } from '@/features/bot/worker/worker';
import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
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
import Youtube from '@utils/youtube';
import { TrackEntity } from '@/infra/entities/track.entity';

export enum VoiceState {
  Idle,
  Play,
  Pause,
  Stop,
}

export class VoiceWorker {
  private _currentPlaylist?: string;
  private _currentTrack?: string;
  private _state: VoiceState = VoiceState.Idle;
  private subscription: PlayerSubscription;
  private _guildVoiceAdaptor: InternalDiscordGatewayAdapterCreator;

  constructor(
    private readonly _guildId: string,
    private _channelId: string,
    private readonly _worker: Worker,
    private readonly playlistService: PlaylistService,
  ) {}

  get state() {
    return this._state;
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

  get playlist(): string {
    return this._currentPlaylist ?? '';
  }

  get track(): string {
    return this._currentTrack ?? '';
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
   * Get Or make new voice connection
   * @private
   */
  private _voiceConnection(): VoiceConnection {
    let connection = getVoiceConnection(this._guildId, this.workerId);
    if (
      !connection ||
      connection.state.status === VoiceConnectionStatus.Destroyed ||
      connection.state.status === VoiceConnectionStatus.Disconnected
    )
      connection = this._newVoiceConnection();
    return connection;
  }

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

  private async newPlayerRessouce(
    track: TrackEntity,
  ): Promise<AudioResource<null>> {
    const readable = await Youtube.getAudioStream(track.url);
    const resource = createAudioResource(readable);
    return resource;
  }

  private async _startPlay() {
    await this._fetchVoiceAdaptor();
    const audioPlayer = this._audioPlayer();
    const track = await this.playlistService.getTrack(this._currentTrack);
    if (!track.isAvailable) return this.onAudioPlayerIdle();
    audioPlayer.play(await this.newPlayerRessouce(track));
    this._state = VoiceState.Play;
  }

  private async _fetchVoiceAdaptor() {
    if (!this._guildVoiceAdaptor)
      this._guildVoiceAdaptor = await this._worker.getGuildVoiceAdaptor(
        this._guildId,
      );
  }

  private async onAudioPlayerIdle() {
    if (this._state !== VoiceState.Play) return;
    const nextTrack = await this.playlistService.getNextTrack(
      this._currentTrack,
      true,
    );
    if (!nextTrack) return;
    this._currentTrack = nextTrack.id;
    await this._startPlay();
  }

  public async play() {
    if (this._state === VoiceState.Play) return;
    if (this._state === VoiceState.Idle || this._state === VoiceState.Stop)
      return await this._startPlay();
    if (this.subscription.player.unpause()) this._state = VoiceState.Play;

    // const playlist = await this.playlistService.getPlaylist(playlistId);
    // if (!playlist) throw new Error('no playlist found');
    // let currentTrack = playlist.tracksOrder[0];
    // if (trackId) {
    //   if (playlist.tracksOrder.indexOf(trackId) < 0)
    //     throw new Error('no track found in playlist');
    //   currentTrack = trackId;
    // }
    // const track = await this.playlistService.getTrack(currentTrack);
    // const audioPlayer = this._audioPlayer();
    // audioPlayer.play(await this.newPlayerRessouce(track));
    // this._currentPlaylist = playlistId;
    // this._currentTrack = currentTrack;
    // this._state = VoiceState.Play;
  }

  public pause() {
    if (this._state === VoiceState.Pause) return true;
    if (this._state === VoiceState.Idle) return false;
    const audioPlayer = this.subscription.player;
    if (!audioPlayer) return false;
    const ok = audioPlayer.pause(true);
    if (!ok) return false;
    this._state = VoiceState.Pause;
    return true;
  }

  // public unpause() {
  //   if (this._state === VoiceState.Play) return true;
  //   if (this._state === VoiceState.Idle) return false;
  //   const audioPlayer = this.subscription.player;
  //   if (!audioPlayer) return false;
  //   const ok = audioPlayer.unpause();
  //   if (!ok) return false;
  //   this._state = VoiceState.Play;
  //   return true;
  // }

  public stop() {
    if (this._state === (VoiceState.Idle || VoiceState.Stop)) return true;
    const audioPlayer = this.subscription.player;
    if (!audioPlayer) return false;
    const ok = audioPlayer.stop();
    if (!ok) return false;
    this._state = VoiceState.Stop;
    return true;
  }

  public async setPlaylist(playlistId: string, track = 1) {
    const playlist = await this.playlistService.getPlaylist(playlistId);
    if (!playlist) throw new Error('no playlist playlist');
    if (playlist.tracksOrder.length === 0)
      throw new Error('no track found in playlist');
    if (track && playlist.tracksOrder.length < track)
      throw new Error(`track n°${track} no found in playlist`);
    this._currentPlaylist = playlist.id;
    this._currentTrack = playlist.tracksOrder[track - 1];
    if (this._state !== VoiceState.Idle) await this._startPlay();
  }

  public destroy() {
    this._state = VoiceState.Idle;
    this.subscription?.player?.stop(true);
    this.subscription?.connection?.disconnect();

    delete this.subscription;
    delete this._guildVoiceAdaptor;
  }

  public async init() {
    return this;
  }
}
