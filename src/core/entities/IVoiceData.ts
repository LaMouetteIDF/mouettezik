import { VoiceStatus } from '../enums/VoiceStatus';

import { ITrackData } from './ITrackData';

export interface IVoiceData {
  id: string;
  guildId: string;
  channelId: string;
  status: VoiceStatus;
  speakingTime: number;
  track?: ITrackData;
}
