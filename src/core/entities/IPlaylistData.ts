import { PlatformType } from '../enums/PlatformType';
import { Uploader } from '../interfaces/Uploader';

import { ITrackData } from './ITrackData';

export interface IPlaylistData {
  id: string;
  title?: string;
  platform?: PlatformType;
  uploader?: Uploader;
  url?: string;
  timestamp?: number;
  isAvailable: boolean;
  tracks: ITrackData[];
}
