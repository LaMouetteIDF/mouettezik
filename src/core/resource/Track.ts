import { instanceToPlain, plainToClass } from 'class-transformer';
import { Readable } from 'stream';
import { getResource } from './index';

import { PlatformType } from '../enums/PlatformType';
import { ITrackData } from 'core/entities/ITrackData';
import { Uploader } from '../interfaces/Uploader';

export class Track implements ITrackData {
  readonly id: string;
  readonly platform: PlatformType;
  readonly title?: string;
  readonly url: string;
  readonly duration: number;
  readonly isAvailable: boolean;
  readonly thumbnail?: string;

  readonly isStream: boolean;
  readonly uploader?: Uploader;

  static from(input: ITrackData) {
    return plainToClass(Track, input);
  }

  public async stream(): Promise<string | Readable> {
    if (!this.url) throw new Error('track url not found');
    const resource = getResource(this.platform);
    return await resource.stream(this);
  }

  toPlain(): ITrackData {
    return instanceToPlain(this) as ITrackData;
  }
}
