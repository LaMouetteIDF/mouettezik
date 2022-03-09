import { BaseBotParams } from '../bot.types';
import { YoutubeURL } from '@utils/youtube';

export type PlayPlayerOptions = BaseBotParams & {
  userId: string;
  guildId: string;
  options?: {
    youtubeURL?: YoutubeURL;
    playlist?: string;
    youtubeTitle?: string;
    track?: number;
  };
};

export type PausePlayerOptions = BaseBotParams & {
  userId: string;
  guildId: string;
};

export type AddPlayerOptions = BaseBotParams & {
  userId: string;
  guildId: string;
  options: {
    youtubeURL: YoutubeURL;
    playlist?: string;
  };
};

export type ListPlayerOptions = BaseBotParams & {
  userId: string;
  guildId: string;
  options: {
    playlist?: string;
  };
};

export type StopPlayerOptions = BaseBotParams & {
  userId: string;
  guildId: string;
};
