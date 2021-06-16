import {
  Guild,
  GuildChannel,
  Message,
  TextChannel,
  VoiceChannel,
} from 'discord.js';
import { CommandoClient } from 'discord.js-commando';
import { CommandoGuild, SQLiteProvider } from 'discord.js-commando';

import { Youtube } from '@/services/download/youtube';
import { Player } from './player';
import { PlayerState, Tracks } from './type';
import { text } from 'express';

// import { DbKeyPlayerState } from './contants';

export class YtPlayer extends Player {
  protected _lastMessage: Map<string, Message>;
  protected _provider: SQLiteProvider;

  constructor(youtube: Youtube, provider: SQLiteProvider) {
    super(youtube);
    this._lastMessage = new Map();
    this._provider = provider;

    this._initPLayer();
  }

  play(guild: Guild, textChannel: TextChannel) {
    const state = this._state.get(guild.id);
    if (!state) throw new Error('Use init command please');
    console.log('toto');
  }

  addTracksInQueue(guild: Guild, tracks: Tracks) {
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

  private _initPLayer() {
    const client = this._provider.client;

    client.on('ready', () => {
      client.guilds.cache.forEach((guild) => {
        // if textChannel ahs not been defined exit config for this guild
        const textChannelID = this._provider.get(guild, 'textChannelID');
        if (!textChannelID) return;

        const textChannel = guild.channels.cache.get(textChannelID);

        let state: PlayerState;

        if (textChannel && textChannel instanceof TextChannel)
          state = this._state.new(guild.id, textChannel);
        else return;

        // if the logsChannel has not been defined it will be equal to textChannel
        const logsChannelID = this._provider.get(guild, 'logsChannelID');
        if (logsChannelID) {
          const logsChannel = guild.channels.cache.get(logsChannelID);
          if (logsChannel && logsChannel instanceof TextChannel) {
            state.logsChannelID = logsChannelID;
            state.logsChannel = logsChannel;
          } else {
            state.logsChannelID = textChannelID;
            state.logsChannel = textChannel;
          }
        }

        // get previously voiceChannel
        const voiceChannelID = this._provider.get(guild, 'voiceChannelID');
        if (voiceChannelID) {
          const voiceChannel = guild.channels.cache.get(voiceChannelID);
          if (voiceChannel && voiceChannel instanceof VoiceChannel) {
            state.voiceChannelID = voiceChannelID;
          }
        }

        // get previous volume state
        const volume = this._provider.get(guild, 'volume');
        if (volume) state.volume = volume;

        // get if music have previously playing
        const playing = this._provider.get(guild, 'playing');
        if (playing) state.playing = playing;

        // get previous music playing time position
        const timepos = this._provider.get(guild, 'timepos');
        if (timepos) state.curPosPlayingTime = timepos;

        console.log(
          textChannelID,
          logsChannelID,
          voiceChannelID,
          volume,
          playing,
          timepos,
        );
      });
    });
  }
}
