import {
  Message,
  TextChannel,
  VoiceChannel,
  VoiceConnection,
} from 'discord.js';
import { CommandoGuild, SQLiteProvider } from 'discord.js-commando';

import { Youtube } from '@/services/download/youtube';
import { Downloads } from '@/services/download';
import { Player } from './player';
import { PlayerState } from './type';

// import { DbKeyPlayerState } from './contants';

export class YtPlayer extends Player {
  protected _lastMessage: Map<string, Message>;
  // protected _provider: SQLiteProvider;

  constructor(download: Downloads, provider: SQLiteProvider) {
    super(download, provider);
    this._lastMessage = new Map();
    // this._provider = provider;
  }

  async play(
    guild: CommandoGuild,
    textChannel: TextChannel,
    tracks?: Tracks,
    joinchannel?: () => Promise<VoiceConnection>,
  ) {
    let state = this._state.get(guild.id);
    let queue = this._queue.get(guild.id);

    if (!state) state = this._state.new(guild.id, textChannel);
    if (!queue) queue = this._queue.new(guild.id);

    queue.potition = tracks ? queue.tracks.length : 0;

    if (tracks) this.addTracksInQueue(guild, tracks);

    if (queue.tracks.length == 0)
      throw new Error('Not found track in the queue');

    if (state.playing) {
      state.playing = false;
      state.killFfmpeg?.();
      // state.voiceConnection?.disconnect();
      delete state.dispatch;
    }
    state.currentPlayingIsLive = false;

    if (joinchannel) await joinchannel();

    await this._play(guild, queue.tracks[queue.potition]);
  }

  pause(guild: CommandoGuild) {
    const state = this._state.get(guild.id);

    if (!state || !state.voiceConnection || !state.dispatch)
      throw new Error('No music is playing !');
    if (state.dispatch.paused) throw new Error('Music are already paused');

    if (state.currentPlayingIsLive) {
      state.dispatch.end(() => {
        state.killFfmpeg?.();
        delete state.dispatch;
      });
      state.playing = false;
    } else {
      state.dispatch.pause();
      state.playing = false;
    }

    this.emit(
      'pause',
      `Player music is paused, in <#${state.voiceConnection.channel.id}>`,
      guild,
      state.logsChannel,
    );
  }

  async resume(guild: CommandoGuild) {
    const state = this._state.get(guild.id);
    const queue = this._queue.get(guild.id);

    if (!state || !queue) throw new Error('No music or stream is paused');

    if (state.currentPlayingIsLive) {
      if (!queue.stream) throw new Error('No stream is paused');
      await this._play(guild, queue.stream);
    } else {
      if (!state.dispatch) throw new Error('No music or stream is paused');

      if (!state.dispatch.paused) throw new Error('Music are already playing');

      state.dispatch.resume();
      state.dispatch.pause();
      state.dispatch.resume();
      state.playing = true;
    }

    this.emit(
      'pause',
      `Player music is resumed, in <#${state.voiceConnection.channel.id}>`,
      guild,
      state.logsChannel,
    );
  }

  stop(guild: CommandoGuild) {
    const state = this._state.get(guild.id);
    const queue = this._queue.get(guild.id);

    if (!state || !queue || !state.voiceConnection || !state.dispatch)
      throw new Error('No music or stream is playing');

    const ChannelID = state.voiceConnection.channel.id;

    state.dispatch.end(() => {
      state.killFfmpeg?.();
      state.voiceConnection.disconnect();
      state.playing = false;
      state.currentPlayingIsLive = false;
      if (ChannelID)
        this.emit(
          'stop',
          `Playing is stoped, in <#${ChannelID}>`,
          guild,
          state.logsChannel,
        );
    });
    delete state.dispatch;
    delete state.voiceConnection;
  }

  volume(guild: CommandoGuild, textChannel: TextChannel, value?: number) {
    const state = this._state.get(guild.id);
    if (!state) throw new Error('Use init command please');

    if (value) {
      if (value >= 0 && value <= 100) {
        state.volume = value;
        this._provider.set(guild, 'volume', value);
        if (state.voiceConnection?.dispatcher) {
          state.voiceConnection.dispatcher.setVolume(value / 100);
        }

        this.emit(
          'play',
          `Volume on this guild is now ${value}%`,
          guild,
          state.logsChannel,
        );
      } else throw new Error('The volume should be between 1 and 100');
    } else {
      textChannel.send(`The volume is ${state.volume}%`);
    }
  }

  addTracksInQueue(guild: CommandoGuild, tracks: Tracks) {
    const guildID = guild.id;
    let queue = this._queue.get(guildID);

    if (!queue) queue = this._queue.new(guildID);
    queue.tracks.push(...tracks);
  }

  getState(guild: CommandoGuild) {
    return this._state.get(guild.id);
  }

  getQueue(guild: CommandoGuild) {
    return this._queue.get(guild.id);
  }

  async joinChannel(
    guild: CommandoGuild,
    textChannel: TextChannel,
    voiceChannel?: VoiceChannel,
  ) {
    const guildID = guild.id;
    let state = this._state.get(guildID);
    if (!state) state = this._state.new(guildID, textChannel);
    if (state.voiceChannelID) {
      voiceChannel ==
        this._provider.client.channels.cache.get(state.voiceChannelID);
    } else if (!voiceChannel) {
      textChannel.send('Please join voice channel !');
    }

    try {
      const connection = await voiceChannel.join();
      connection.on('disconnect', (err) => {
        if (err) console.log(err);
        state.killFfmpeg?.();
        delete state.voiceConnection;
        delete state.dispatch;
      });
      state.voiceChannelID = voiceChannel.id;
      state.voiceConnection = connection;
      return connection;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async playStream(
    guild: CommandoGuild,
    textChannel: TextChannel,
    track?: Track,
    joinchannel?: () => Promise<VoiceConnection>,
  ) {
    let state = this._state.get(guild.id);
    let queue = this._queue.get(guild.id);

    if (!state) state = this._state.new(guild.id, textChannel);
    if (!queue) queue = this._queue.new(guild.id);

    const stream = track ?? queue.stream;

    if (!stream) throw new Error('Stream not found in queue await.');

    if (!stream.live) throw new Error('This url is not live stream');

    queue.stream = stream;

    if (joinchannel) await joinchannel();
    
    await this._play(guild, stream);
    state.currentPlayingIsLive = true;
  }

  isPaused(guild: CommandoGuild) {
    const state = this._state.get(guild.id);
    return state && state.dispatch && state.dispatch.paused ? true : false;
  }
}
