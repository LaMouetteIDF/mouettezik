import { EventEmitter } from 'events';
import { Youtube } from '@/services/download/youtube';
// import { EventEmitter } from 'stream';
import { PlayerEvents, PlayerState, PlayerQueue, Track } from './type';
import { CollectionQueue, CollectionState } from './utils';

export declare interface Player {
  on<K extends keyof PlayerEvents>(
    event: K,
    listener: (...args: PlayerEvents[K]) => void,
  ): this;
  once<K extends keyof PlayerEvents>(
    event: K,
    listener: (...args: PlayerEvents[K]) => void,
  ): this;
  emit<K extends keyof PlayerEvents>(
    event: K,
    ...args: PlayerEvents[K]
  ): boolean;
}

export class Player extends EventEmitter {
  protected _youtube: Youtube;
  protected _queue: CollectionQueue;
  protected _state: CollectionState;

  constructor(youtube: Youtube) {
    super();
    this._youtube = youtube;
    this._queue = new CollectionQueue();
    this._state = new CollectionState();
  }
}
