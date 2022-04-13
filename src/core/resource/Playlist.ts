import { plainToClass, Type } from 'class-transformer';

import { Track } from './Track';

import { IPlaylistData } from 'core/entities/IPlaylistData';
import { Uploader } from '../interfaces/Uploader';
import { PlatformType } from '../enums/PlatformType';

export class Playlist implements IPlaylistData {
  readonly id: string;
  readonly title?: string;
  readonly platform?: PlatformType;
  readonly uploader?: Uploader;
  readonly url?: string;
  readonly timestamp?: number;
  readonly isAvailable: boolean;

  @Type(() => Track)
  readonly tracks: Track[];

  static from(playlist: IPlaylistData) {
    return plainToClass(Playlist, playlist);
  }
}
