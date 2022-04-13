import { promisify } from 'node:util';
import {
  StageChannel,
  VoiceChannel,
  VoiceState as DSVoiceState,
} from 'discord.js';

import {
  AudioPlayer,
  AudioPlayerError,
  AudioPlayerState,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionStatus,
} from '@discordjs/voice';

import { IEventRunner } from 'core/abstract/IEventRunner';
import { IVoiceData } from 'core/entities/IVoiceData';
import { VoiceStatus } from 'core/enums/VoiceStatus';

import { CommonService } from 'common/common.service';
import { Worker } from 'core/Worker';
import { Track } from 'core/resource/Track';

import { Util } from 'utils/index';

import type { Player } from './Player';

const wait = promisify(setTimeout);

type InternalVoiceState = IVoiceData & {
  track?: Track;
};

export type VoiceState = InternalVoiceState & {
  voice: Voice;
};

type VoiceEvents = {
  stateChange: (oldState: VoiceState, newState: VoiceState) => void;
  destroy: () => void;
} & {
  [status in VoiceStatus]: (
    oldState: VoiceState,
    newState: VoiceState,
  ) => Awaited<void>;
};

type VoiceOptions = {
  destroyTimeout: number;
};

// 10 min
const DEFAULT_DESTROY_TIMEOUT = 10 * 60 * 1_000;

export class Voice extends IEventRunner<VoiceState, VoiceEvents> {
  private _state: InternalVoiceState;
  private readonly _audio: AudioPlayer;
  private readonly _connection: VoiceConnection;
  private _destroyed = false;
  private _readyLock = false;

  private _player?: Player;

  private _options: VoiceOptions;

  constructor(
    public readonly core: CommonService,
    public readonly worker: Worker,
    connection: VoiceConnection,
    data: Omit<IVoiceData, 'track'>,
    options?: Partial<VoiceOptions>,
  ) {
    super();

    const defaultOptions: VoiceOptions = {
      destroyTimeout: DEFAULT_DESTROY_TIMEOUT,
    };

    this._options = Object.assign({}, options, defaultOptions);

    this._state = { ...data, track: undefined };

    this._connection = connection;

    this._audio = createAudioPlayer({
      debug: false,
      behaviors: { noSubscriber: NoSubscriberBehavior.Play },
    });

    worker.raw.on('voiceStateUpdate', this._onUserVoiceStateChange);
    this._addConnectionListeners();
    this._addAudioListeners();

    this.once('destroy', () => {
      worker.raw.removeListener(
        'voiceStateUpdate',
        this._onUserVoiceStateChange,
      );
      this._removeConnectionListeners();
      this._removeAudioListeners();
      this._connection.destroy();
      this._audio.stop(true);
    });

    this._connection.subscribe(this._audio);
  }

  get id(): string {
    return this._state.id;
  }

  get guildId(): string {
    return this._state.guildId;
  }

  get channelId(): string {
    return this._state.channelId;
  }

  set channelId(channelId: string) {
    this.state = {
      ...this.state,
      channelId,
    };
  }

  get workerId(): string {
    return this.worker.id;
  }

  get player(): Player | undefined {
    return this._player;
  }

  get connection(): VoiceConnection {
    return this._connection;
  }

  get audio(): AudioPlayer {
    return this._audio;
  }

  get destroyed(): boolean {
    return this._destroyed;
  }

  get state(): VoiceState {
    return { ...this._state, voice: this };
  }

  set state(newState: VoiceState) {
    if (this._destroyed) return;
    const oldState = this.state;

    if (false) {
      for (let i = 0; i < 1; i++) console.log('\n');
      console.log('OLD VOICE STATE -- ', oldState.status);
      console.log('NEW VOICE STATE -- ', newState.status);
      for (let i = 0; i < 1; i++) console.log('\n');
    }

    this._state = {
      ...Util.getOnlyKeys<InternalVoiceState>(
        Object.keys(this._state),
        newState,
      ),
    };

    this.emit('stateChange', oldState, newState);

    if (oldState.status !== newState.status)
      this.emit(newState.status, oldState, newState);
  }

  get speakingTime(): number {
    const time = this.audio.state['playbackDuration'];
    if (typeof time !== 'number') return 0;
    return Math.floor(time / 1_000);
  }

  public async play(input: Track): Promise<void> {
    await this._playTrack(input);
  }

  public pause(): boolean {
    return this.audio.pause(true) ?? false;
  }

  public resume(): boolean {
    return this.audio.unpause() ?? false;
  }

  public stop(): boolean {
    return this.audio.stop(true) ?? false;
  }

  public async connect(): Promise<void> {
    return await this._connect();
  }

  public setSubscriber(player: Player): void {
    this._player = player;
  }

  public destroy(): void {
    this._destroy();
  }

  private async _connect(): Promise<void> {
    if (this._destroyed) throw new Error('voice is destroyed');

    try {
      await entersState(this._connection, VoiceConnectionStatus.Ready, 20e3);
      await this._checkWithDestroy();
    } catch (e) {
      console.log('Error connection');
      console.error(e);
    }
  }

  private async _playTrack(track: Track): Promise<void> {
    await this._connect();

    this.audio.play(
      createAudioResource(await track.stream(), {
        metadata: track,
      }),
    );
  }

  private async _channelHasUserListen(
    channel: VoiceChannel | StageChannel,
  ): Promise<boolean> {
    const usersInChannel = channel.members.filter(({ user }) => !user.bot);
    if (!usersInChannel.size) return false;
    return !usersInChannel.every(({ voice }) => voice.deaf);
  }

  private async _checkCurrentVoice(): Promise<boolean> {
    const { voice } = await this.worker.getGuildMember(this.guildId);

    if (!voice.channelId) return false;

    return !voice.mute;
  }

  private _hasOtherVoice(channel: VoiceChannel): boolean {
    const bots = channel.members.filter(({ user }) => user.bot);
    if (bots.size === 0) return false;

    const allWorkersIds = [...this.core.workers.keys()].filter(
      (id) => id !== this.worker.id,
    );

    const workers = bots.filter(({ user }) => allWorkersIds.includes(user.id));

    return workers.size > 0;
  }

  private async _checkWithDestroy(): Promise<boolean> {
    try {
      const { voice: workerVoice } = await this.worker.getGuildMember(
        this.guildId,
      );

      if (
        workerVoice.mute ||
        !workerVoice.channel ||
        !channelHasUserListening(workerVoice.channel)
      ) {
        this._startDestroyTimer();
        return true;
      } else {
        this._stopDestroyTimer();
        return false;
      }
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  private _destroyTimer: NodeJS.Timeout;

  private _isPauseByDestroyTimer = false;

  private _startDestroyTimer(): void {
    if (this._destroyTimer || this._destroyed) return;

    this._destroyTimer = setTimeout(() => {
      this._destroy();
    }, this._options.destroyTimeout);

    if (this._state.status !== VoiceStatus.Speak) return;

    this._isPauseByDestroyTimer = this.pause();
  }

  private _stopDestroyTimer(): void {
    if (!this._destroyTimer || this._destroyed) return;

    clearTimeout(this._destroyTimer);
    delete this._destroyTimer;

    if (
      !this._isPauseByDestroyTimer ||
      this._state.status !== VoiceStatus.Pause
    )
      return;

    this._isPauseByDestroyTimer = true;
    this._audio.unpause();
  }

  private _destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    this._stopDestroyTimer();

    this._state = {
      ...this._state,
      speakingTime: 0,
      track: undefined,
      status: VoiceStatus.Idle,
    };

    this.emit('destroy');
    this.removeAllListeners();
  }

  private _addConnectionListeners(): void {
    this._connection.on('error', this._onConnectionError);
    this._connection.on('stateChange', this._onConnectionStateChange);
  }

  private _addAudioListeners(): void {
    this._audio.on('error', this._onAudioError);
    this._audio.on('debug', console.log);
    this._audio.on('stateChange', this._onAudioStateChange);
  }

  private _removeConnectionListeners(): void {
    this._connection.removeListener('error', this._onConnectionError);
    this._connection.removeListener(
      'stateChange',
      this._onConnectionStateChange,
    );
  }

  private _removeAudioListeners(): void {
    this._audio.removeListener('error', this._onAudioError);
    this._audio.removeListener('stateChange', this._onAudioStateChange);
  }

  private _onConnectionError = (err: Error): void => {
    console.warn(err);
  };

  private _onAudioError = (error: AudioPlayerError): void => {
    console.warn(error);
  };

  private _onConnectionStateChange = async (
    _: any,
    newState: { status: any; reason: any; closeCode: number },
  ): Promise<void> => {
    if (this.destroyed) return;
    if (newState.status === VoiceConnectionStatus.Disconnected) {
      if (
        newState.reason === VoiceConnectionDisconnectReason.WebSocketClose &&
        newState.closeCode === 4014
      ) {
        try {
          const { voice } = await this.worker.getGuildMember(this.guildId);

          if (!voice.channelId) return this._destroy();
          if (this.channelId !== voice.channelId) {
            this.channelId = voice.channelId;
            if (this.player && voice.channelId !== this.player.channelId)
              this._startDestroyTimer();
            else this._stopDestroyTimer();
          }

          await entersState(
            this._connection,
            VoiceConnectionStatus.Connecting,
            5_000,
          );
        } catch {
          return this._destroy();
        }
      } else if (this._connection.rejoinAttempts < 5) {
        await wait((this._connection.rejoinAttempts + 1) * 5_000);

        this._connection.rejoin();
      } else {
        console.log('destroy: rejoinAttempts > 5');

        return this._destroy();
      }
    } else if (
      !this._readyLock &&
      (newState.status === VoiceConnectionStatus.Connecting ||
        newState.status === VoiceConnectionStatus.Signalling)
    ) {
      this._readyLock = true;
      try {
        await entersState(
          this._connection,
          VoiceConnectionStatus.Ready,
          20_000,
        );
        this._readyLock = false;
      } catch (e) {
        console.error(e);
        return this._destroy();
      }
    }
  };

  private _onAudioStateChange = (
    oldState: AudioPlayerState,
    newState: AudioPlayerState,
  ): Promise<void> => {
    if (this.destroyed) return;

    if (false) {
      for (let i = 0; i < 1; i++) console.log('\n');
      console.log('OLD AUDIO STATE -- ', oldState.status);
      console.log('NEW AUDIO STATE -- ', newState.status);
      for (let i = 0; i < 1; i++) console.log('\n');
    }

    if (oldState.status !== newState.status) {
      switch (newState.status) {
        case AudioPlayerStatus.Playing:
          this._stopDestroyTimer();

          const { metadata } = newState.resource;
          let track: Track;
          if (metadata instanceof Track) track = metadata;

          this.state = {
            ...this.state,
            status: VoiceStatus.Speak,
            track,
          };
          break;
        case AudioPlayerStatus.AutoPaused:
        case AudioPlayerStatus.Paused:
          this.state = {
            ...this.state,
            status: VoiceStatus.Pause,
          };
          this._startDestroyTimer();
          break;
        case AudioPlayerStatus.Idle:
          this._state.speakingTime = oldState['playbackDuration'] ?? 0;
          this.state = {
            ...this.state,
            status: VoiceStatus.Idle,
            track: undefined,
          };
          this._startDestroyTimer();
          break;
      }
    }
  };

  private _onUserVoiceStateChange = async (
    oldUserState: DSVoiceState,
    newUserState: DSVoiceState,
  ): Promise<void> => {
    if (newUserState.id == this.workerId) {
      await this._checkWithDestroy();
      return;
    }

    if (
      oldUserState.channelId !== this.channelId &&
      newUserState.channelId !== this.channelId
    )
      return;

    if (
      oldUserState.channelId !== newUserState.channelId ||
      oldUserState.deaf !== newUserState.deaf
    ) {
      await this._checkWithDestroy();
    }
  };
}

function channelHasUserListening(channel: VoiceChannel | StageChannel) {
  const usersInChannel = channel.members.filter(({ user }) => !user.bot);
  if (usersInChannel.size === 0) return false;
  return usersInChannel.some(({ voice }) => !voice.deaf);
}
