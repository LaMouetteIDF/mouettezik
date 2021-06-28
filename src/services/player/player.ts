import { EventEmitter } from 'events';
import { CommandoGuild, SQLiteProvider } from 'discord.js-commando';
import { Downloads } from '@/services/download';
import { Youtube } from '@/services/download/youtube';
// import { EventEmitter } from 'stream';
import { PlayerEvents, PlayerState, PlayerQueue } from './type';
import { CollectionQueue, CollectionState } from './utils';
import { TextChannel, VoiceChannel } from 'discord.js';

import * as ffmpeg from 'fluent-ffmpeg';
import * as execa from 'execa';
import { PassThrough, Readable } from 'stream';

export declare interface Player {
  on<K extends keyof PlayerEvents>(
    event: K,
    listener: (...args: PlayerEvents[K]) => void,
  ): this;
  once<K extends keyof PlayerEvents>(
    event: K,
    listener: (...args: PlayerEvents[K]) => void,
  ): this;
  emit<K extends keyof PlayerEvents>(
    event: K,
    ...args: PlayerEvents[K]
  ): boolean;
}

export class Player extends EventEmitter {
  protected _download: Downloads;
  protected _provider: SQLiteProvider;
  protected _queue: CollectionQueue;
  protected _state: CollectionState;

  constructor(download: Downloads, provider: SQLiteProvider) {
    super();
    this._download = download;
    this._provider = provider;
    this._queue = new CollectionQueue();
    this._state = new CollectionState();
    this._initPLayer();
  }

  intiGuild(guild: CommandoGuild, textChannel: TextChannel) {
    const state = this._state.new(guild.id, textChannel);
    if (!state) throw new Error('error into initialized guild');
    this.emit(
      'config',
      'Your guild as full success initialized',
      guild,
      textChannel,
    );
  }

  setTextChannel(guild: CommandoGuild, textChannel: TextChannel) {
    this._provider.set(guild, 'textChannelID', textChannel.id);
    const state = this._state.get(guild.id);
    if (!state)
      throw new Error(
        'Your guild is not initialized. Please use command [!config init]',
      );
    state.textChannelID = textChannel.id;
    state.textChannel = textChannel;
    this.emit(
      'config',
      `the channel <#${textChannel.id}> is now use as default`,
      guild,
      textChannel,
    );
  }

  getTextChannel(guild: CommandoGuild) {
    const state = this._state.get(guild.id);
    if (!state)
      throw new Error(
        'Your guild is not initialized. Please use command [!config init]',
      );
    return state.textChannel;
  }

  setLogChannel(guild: CommandoGuild, logsChannel: TextChannel) {
    this._provider.set(guild, 'logsChannelID', logsChannel.id);
    const state = this._state.get(guild.id);
    if (!state)
      throw new Error(
        'Your guild is not initialized. Please use command [!config init]',
      );
    state.logsChannelID = logsChannel.id;
    state.logsChannel = logsChannel;
    this.emit(
      'config',
      `the channel <#${logsChannel.id}> is now use for logs`,
      guild,
      logsChannel,
    );
  }

  getLogChannel(guild: CommandoGuild) {
    const state = this._state.get(guild.id);
    if (!state)
      throw new Error(
        'Your guild is not initialized. Please use command [!config init]',
      );
    return state.logsChannel;
  }

  protected async _play(guild: CommandoGuild, track: Track) {
    const state = this._state.get(guild.id);
    const queue = this._queue.get(guild.id);
    const connection = state.voiceConnection;
    if (connection) {
      try {
        let stream: Readable | PassThrough;
        const st = await this._download.getAudioStream(track);
        if (st instanceof Readable) stream = st;
        else {
          stream = st.stream;
          state.killFfmpeg = st.kill;
        }

        const dispatch = connection.play(stream);
        dispatch
          .on('start', () => {
            state.playing = true;
            if (state.currentPlayingIsLive) {
              this.emit(
                'stream',
                `Streaming: **${track.title}**, in <#${connection.channel.id}>\n${track.url}`,
                guild,
                state.logsChannel,
              );
            } else {
              this.emit(
                'play',
                `Playing: **${track.title}**, in <#${connection.channel.id}>\n${track.url}`,
                guild,
                state.logsChannel,
              );
            }
          })
          .on('finish', () => {
            state.killFfmpeg?.();
            if (!state.playing) return;
            if (queue.loopOneTrack) return this._play(guild, track);
            if (queue.potition >= queue.tracks.length - 1) {
              const pos = (queue.potition = 0);
              const track = queue.tracks[pos];
              this._play(guild, track);
            } else {
              const pos = ++queue.potition;
              const track = queue.tracks[pos];
              this._play(guild, track);
            }
          });
        state.dispatch = dispatch;
        dispatch.setVolume(state.volume / 100);
      } catch (e) {
        console.log(e);
        throw e;
      }
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
      });
    });
  }
}
