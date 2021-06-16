import { Guild } from 'discord.js';
import { Youtube } from '@/services/download/youtube';
import { YtPlayer } from '@/services/player/yt-player';

declare global {}

declare module 'discord.js-commando' {
  interface Client {
    youtube: Youtube;
    music: YtPlayer;
  }

  interface SQLiteProviderGet {
    textChannelID: string | undefined;
    logsChannelID: string | undefined;
    voiceChannelID: string | undefined;
    playing: boolean;
    volume: number | undefined;
    timepos: number | undefined; // current music playing time positon
  }

  interface SQLiteProvider {
    /**
     * @returns there is a possibility that it makes undefined
     */
    get<K extends keyof SQLiteProviderGet>(
      guild: string | Guild,
      key: K,
      defVal?: any,
    ): SQLiteProviderGet[K];
  }
}
