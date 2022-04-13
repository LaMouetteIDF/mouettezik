import { IResourceBase } from '../abstract/IResourceBase';
import { BaseResourceData } from './ResourceType';
import { IPlaylistData } from 'core/entities/IPlaylistData';
import { ITrackData } from 'core/entities/ITrackData';
import {
  dataToPlaylist,
  dataToTrack,
  getMetadata,
  getStream,
} from './ResourceUtil';
import { If } from 'discord.js';
import { PlatformType } from '../enums/PlatformType';
import { Readable } from 'stream';

export class Resource<
  Data extends object = BaseResourceData,
> extends IResourceBase {
  static isValidHost: (url: string) => boolean;
  static platform: PlatformType;
  platform: PlatformType;
  protected _data?: Data;

  constructor(public readonly url: string) {
    super();
  }

  static async stream(track: ITrackData): Promise<string | Readable> {
    return getStream(track.url);
  }

  async fetch(): Promise<IResourceBase<true>> {
    if (!this._data) this._data = await getMetadata<Data>(this.url);
    return this;
  }

  getMetaData(): If<boolean, IPlaylistData | ITrackData, undefined> {
    if (!this._data || typeof this._data !== 'object') return undefined;

    return this.isPlaylist()
      ? dataToPlaylist(this._data as any, this.platform)
      : dataToTrack(this._data as any, this.platform);
  }

  isPlaylist(): this is IResourceBase<true, IPlaylistData> {
    if (!this._data) return false;
    return this._data['_type'] === 'playlist';
  }

  isTrack(): this is IResourceBase<true, ITrackData> {
    if (!this._data) return false;
    return !this._data['_type'];
  }

  clean(): void {
    delete this._data;
  }
}
