import { YoutubeURL } from '@utils/youtube';
import { Collection } from 'discord.js';
import { VoiceWorker } from '@/features/bot/voice/voiceWorker';

export type BaseVoiceMessage<T extends string = string> = {
  type: T;
};

export type PlayVoiceMessage = BaseVoiceMessage<'play'> & {
  channelId: string;
  youtubeURL: YoutubeURL;
};

export type PauseVoiceMessage = BaseVoiceMessage<'pause'>;

export type StopeVoiceMessage = BaseVoiceMessage<'stop'>;

export type GuildId = string;

export type WorkerId = string;

export type GuildCollection = Collection<WorkerId, VoiceWorker>;
