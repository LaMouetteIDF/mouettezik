import { Youtube } from './services/download/youtube';
import { YtPlayer } from './services/player/yt-player';

declare module 'discord.js-commando' {
  // provide typings for `this.$store`
  interface Client {
    youtube: Youtube;
    music: YtPlayer;
  }
}
