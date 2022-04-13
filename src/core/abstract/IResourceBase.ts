import { If } from 'discord.js';

import { IPlaylistData } from '../entities/IPlaylistData';
import { ITrackData } from '../entities/ITrackData';
import { PlatformType } from '../enums/PlatformType';

export abstract class IResourceBase<
  Cached extends boolean = boolean,
  T = Omit<IPlaylistData | ITrackData, 'id'>,
> {
  abstract readonly platform: PlatformType;

  abstract isPlaylist(): this is IResourceBase<Cached, IPlaylistData>;

  abstract isTrack(): this is IResourceBase<Cached, ITrackData>;

  abstract getMetaData(): If<Cached, T, undefined>;

  abstract fetch(): Promise<IResourceBase<true>>;

  abstract clean(): void;
}
