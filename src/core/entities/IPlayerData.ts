import { PlayerStatus } from '../enums/PlayerStatus';
import { PlayerRepeat } from '../enums/PlayerRepeat';

import { IPlaylistData } from './IPlaylistData';
import { IQueueData } from './IQueueData';
import { ITrackData } from './ITrackData';

export interface IPlayerData {
  id: string;
  guildId: string;
  channelId: string;
  status: PlayerStatus;
  repeat: PlayerRepeat;
  current?: ITrackData;
  playlist?: IPlaylistData;
  queue: IQueueData;
  allPlayingTime: number;
}
