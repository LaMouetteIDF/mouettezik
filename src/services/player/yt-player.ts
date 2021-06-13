import { Youtube } from '@/services/download/youtube';
import {
  Guild,
  GuildChannel,
  Message,
  TextChannel,
  VoiceChannel,
} from 'discord.js';
import { CommandoClient } from 'discord.js-commando';
import { CommandoGuild, SQLiteProvider } from 'discord.js-commando';
import { Player } from './player';
import { Tracks } from './type';
import { DbKeyPlayerState } from './contants';

export class YtPlayer extends Player {
  protected _lastMessage: Map<string, Message>;
  protected _provider: SQLiteProvider;

  constructor(youtube: Youtube, provider: SQLiteProvider) {
    super(youtube);
    this._lastMessage = new Map();
    this._provider = provider;

    this._initFetchdata();
  }

  play(guild: Guild, textChannel: GuildChannel) {}

  addInQueue(guild: Guild, textChannel: TextChannel, tracks: Tracks) {
    const guildID = guild.id;
    let queue = this._queue.get(guildID);
    if (!queue) queue = this._queue.new(guildID);
    queue.tracks.push(...tracks);
  }

  async joinChannel(
    guild: CommandoGuild,
    textChannel: TextChannel,
    voiceChannel: VoiceChannel,
  ) {
    const guildID = guild.id;
    let state = this._state.get(guildID);
    if (!state) state = this._state.new(guildID, textChannel);

    try {
      const connection = await voiceChannel.join();
      // console.log(connection);
      state.voiceChannelID = voiceChannel.id;
      state.voiceConnection = connection;
      state.timer.newTimer();
      setTimeout(() => {
        state.timer.clearTimer();
      }, 200);
    } catch (e) {
      throw e;
    }
  }

  private _initFetchdata() {
    const client = this._provider.client;

    client.on('ready', () => {
      client.guilds.cache.forEach((guild) => {
        const textChannelID = this._provider.get(
          guild,
          DbKeyPlayerState.TEXT_CHANNEL_ID,
        );
        const logsChannelID = this._provider.get(
          guild,
          DbKeyPlayerState.LOGS_CHANNEL_ID,
        );
        const voiceChannelID = this._provider.get(
          guild,
          DbKeyPlayerState.VOICE_CHANNEL_ID,
        );
        const volume = this._provider.get(guild, DbKeyPlayerState.VOLUME);
        const currentPlayingTime = this._provider.get(
          guild,
          DbKeyPlayerState.CURRENT_PLAYING_TIME,
        );

        console.log(
          textChannelID,
          logsChannelID,
          voiceChannelID,
          volume,
          currentPlayingTime,
        );
      });
    });
  }
}
