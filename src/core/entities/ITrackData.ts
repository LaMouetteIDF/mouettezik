import { PlatformType } from '../enums/PlatformType';
import { Uploader } from '../interfaces/Uploader';

export interface ITrackData {
  id: string;
  platform: PlatformType;
  title?: string;
  uploader?: Uploader;
  url: string;
  duration: number;
  thumbnail?: string;
  isStream: boolean;
  isAvailable: boolean;
}
