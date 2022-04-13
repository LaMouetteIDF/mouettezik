import { IEventRunner } from 'core/abstract/IEventRunner';
import { PlayerStatus } from 'core/enums/PlayerStatus';
import { PlayerRepeat } from 'core/enums/PlayerRepeat';
import { VoiceStatus } from 'core/enums/VoiceStatus';
import { IPlayerData } from 'core/entities/IPlayerData';

import { TrackList } from 'core/resource/TrackList';
import { Playlist } from 'core/resource/Playlist';
import { Track } from 'core/resource/Track';

import { Voice, VoiceState } from './Voice';

import { Util } from 'utils/index';

type InternalState = IPlayerData & {
  current?: Track;
  playlist?: Playlist;
  queue: TrackList;
};

export type PlayerState = InternalState & {
  player: Player;
};

type PlayerEvents = {
  stateChange: (oldState: PlayerState, newState: PlayerState) => void;
  destroy: () => void;
} & {
  [status in PlayerStatus]: (
    oldState: PlayerState,
    newState: PlayerState & {
      status: status;
    },
  ) => Awaited<void>;
};

export class Player extends IEventRunner<PlayerState, PlayerEvents> {
  constructor(state: IPlayerData) {
    super();

    const current = state.current && Track.from(state.current);
    const playlist = state.playlist && Playlist.from(state.playlist);

    this._state = {
      ...state,
      current,
      playlist,
      queue: new TrackList(...state.queue),
    };
  }

  get guildId() {
    return this._state.guildId;
  }

  get channelId() {
    return this._state.channelId;
  }

  private _state: InternalState;

  get state(): PlayerState {
    return { ...this._state, player: this };
  }

  set state(newState: PlayerState) {
    const oldState = this.state;

    if (false) {
      for (let i = 0; i < 1; i++) console.log('\n');
      console.log('OLD PLAYER STATE -- ', oldState.status);
      console.log('NEW PLAYER STATE -- ', newState.status);
      for (let i = 0; i < 1; i++) console.log('\n');
    }
    this._state = {
      ...Util.getOnlyKeys<InternalState>(Object.keys(this._state), newState),
    };

    this.emit('stateChange', oldState, newState);

    if (oldState.status !== newState.status) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.emit(newState.status, oldState, newState);
    }
  }

  private _voice: Voice;

  get voice(): Voice {
    return this._voice;
  }

  get id() {
    return this._state.id;
  }

  get currentPlayingTime(): number {
    return this.voice?.speakingTime ?? 0;
  }

  public async play(resource?: Playlist | Track, index = 0) {
    if (!this._voice) throw new Error('no subscribed voice');

    const { queue, current } = this._state;

    if (resource instanceof Track) {
      queue.addReplace(resource);

      await this._playTrack(resource);
    } else if (resource instanceof Playlist) {
      const { tracks } = resource;

      if (tracks.length === 0) throw new Error('no track in playlist');

      const queue = new TrackList(...tracks);

      const current = queue.get(index);
      if (!current) throw new Error('invalid index');

      this.state = {
        ...this.state,
        queue,
        playlist: resource,
        current,
      };

      await this._playTrack(current);
    } else {
      if (!current && !queue.size) throw new Error('no track');

      await this._playTrack(current ?? queue.current);

      this.state = {
        ...this.state,
        current: current ?? queue.current,
      };
    }
  }

  public pause() {
    return this.voice?.pause() ?? false;
  }

  public resume() {
    return this.voice?.resume() ?? false;
  }

  public async next() {
    const { queue, current } = this.state;

    if (!queue.size && current) return this._playTrack(current);
    if (!queue.size) throw new Error('no track in queue');
    const track = queue.loop;
    if (!track) throw new Error('no track');
    return await this._playTrack(track);
  }

  public async previous(force = false) {
    const { queue, current } = this.state;

    if (!queue.size && current) return this._playTrack(current);
    if (!queue.size) throw new Error('no track in queue');

    // 10 SECONDS
    if (!force && this.voice && this.voice.speakingTime > 1_000 * 10)
      return await this._playTrack(queue.current);

    const track = queue.previous;
    if (!track) throw new Error('no track');

    return await this._playTrack(track);
  }

  public stop() {
    return this._stop();
  }

  public setRepeat(repeat: PlayerRepeat) {
    this.state = {
      ...this.state,
      repeat,
    };
  }

  public subscribe(voice: Voice) {
    if (this._voice) throw new Error('player already has worker');
    this._voice = voice;

    this._subscribeVoice(voice);

    return this;
  }

  public unsubscribe(): Voice | undefined {
    return this._unsubscribeVoice();
  }

  private async _playTrack(track: Track) {
    if (!this.voice) throw new Error('no voice subscribe');
    await this.voice.play(track);
    this.state = {
      ...this.state,
      current: track,
    };
  }

  private async _nextInQueue() {
    const { queue, current, repeat, status } = this._state;

    if (status === PlayerStatus.Stop) return;

    switch (repeat) {
      case PlayerRepeat.One: {
        const track = current || queue.current;

        if (!track) return void this._stop();

        try {
          await this._playTrack(track);
        } catch (e) {
          console.error(e);
          return void this._stop();
        }
        break;
      }
      case PlayerRepeat.All: {
        if (!queue.size && current) {
          try {
            return void (await this._playTrack(current));
          } catch (e) {
            console.error(e);
            return void this._stop();
          }
        } else if (!queue.size) return void this._stop();
        const track = queue.loop;
        if (!track) return void this._stop();
        try {
          await this._playTrack(track);
        } catch (e) {
          console.error(e);
          return await this._nextInQueue();
        }
        break;
      }
      case PlayerRepeat.None: {
        if (!queue.size) return void this._stop();
        const track = queue.next;

        if (!track) {
          const fistTrack = queue.reset();

          this.state = {
            ...this.state,
            status: PlayerStatus.Stop,
            current: fistTrack ?? current,
          };

          return void this.voice?.stop();
        }

        try {
          await this._playTrack(track);
        } catch (e) {
          console.error(e);
          return await this._nextInQueue();
        }
        break;
      }
    }
  }

  private _stop() {
    if (this._state.status === PlayerStatus.Stop) return false;
    this.state = {
      ...this.state,
      status: PlayerStatus.Stop,
    };

    return this._voice?.stop() ?? false;
  }

  private _onVoiceStateChange = (
    oldState: VoiceState,
    newState: VoiceState,
  ) => {
    if (oldState.status !== newState.status)
      switch (newState.status) {
        case VoiceStatus.Speak:
          const current = newState.track;
          this.state = {
            ...this.state,
            status: PlayerStatus.Play,
            current,
          };
          break;
        case VoiceStatus.Pause:
          this.state = {
            ...this.state,
            status: PlayerStatus.Pause,
          };
          break;
        case VoiceStatus.Idle:
          return void this._nextInQueue().catch((e) => {
            console.error(e);
            this._stop();
          });
      }
  };

  private _subscribeVoice(voice: Voice) {
    if (voice.player) {
      const { current, playlist, queue, status, repeat } = voice.player.state;

      const state = {
        ...this.state,
        current,
        playlist,
        status,
        repeat,
        queue: new TrackList(...queue),
      };

      state.queue.index = queue.index;

      this.state = state;

      voice.player.unsubscribe();
    }

    voice.on('stateChange', this._onVoiceStateChange);
    voice.once('destroy', this._onVoiceDestroy);
    voice.setSubscriber(this);
  }

  private _unsubscribeVoice() {
    if (!this._voice) return;

    this._voice.removeListener('stateChange', this._onVoiceStateChange);
    this._voice.removeListener('destroy', this._onVoiceDestroy);

    const voice = this._voice;

    delete this._voice;

    this.state = {
      ...this.state,
      status: PlayerStatus.Stop,
    };
    return voice;
  }

  private _onVoiceDestroy = () => {
    void this._unsubscribeVoice();
  };
}
