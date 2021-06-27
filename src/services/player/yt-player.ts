import { Message, TextChannel, VoiceChannel } from 'discord.js';
import { CommandoGuild, SQLiteProvider } from 'discord.js-commando';

import { Youtube } from '@/services/download/youtube';
import { Player } from './player';
import { PlayerState, Tracks } from './type';

// import { DbKeyPlayerState } from './contants';

export class YtPlayer extends Player {
  protected _lastMessage: Map<string, Message>;
  // protected _provider: SQLiteProvider;

  constructor(youtube: Youtube, provider: SQLiteProvider) {
    super(youtube, provider);
    this._lastMessage = new Map();
    // this._provider = provider;
  }

  play(guild: CommandoGuild, textChannel: TextChannel) {
    const state = this._state.get(guild.id);
    const queue = this._queue.get(guild.id);

    if (!state) throw new Error('Use init command please');
    if (!queue) throw new Error('Queue is not initialized');

    // console.log(queue.tracks, 'pos', queue.potition);
    if (state.playing) {
      queue.potition++;
      state.ffmpeg?.kill('SIGKILL');
    }

    this._play(guild, queue.tracks[queue.potition]);
  }

  pause(guild: CommandoGuild, textChannel: TextChannel) {
    const errorNoMusic = 'No music is playing !';

    const state = this._state.get(guild.id);

    if (!state) return textChannel.send(errorNoMusic);
    if (!state.voiceConnection?.dispatcher)
      return textChannel.send(errorNoMusic);
    if (state.voiceConnection?.dispatcher?.paused)
      return textChannel.send('Music are already paused');

    state.voiceConnection?.dispatcher?.pause();
    this.emit(
      'pause',
      `Player music is paused, in <#${state.voiceConnection.channel.id}>`,
      guild,
      state.logsChannel,
    );
  }

  resume(guild: CommandoGuild, textChannel: TextChannel) {
    const errorNoMusic = 'No music is paused !';

    const state = this._state.get(guild.id);

    if (!state) return textChannel.send(errorNoMusic);
    if (!state.voiceConnection?.dispatcher)
      return textChannel.send(errorNoMusic);
    if (!state.voiceConnection?.dispatcher?.paused)
      return textChannel.send('Music are already playing');

    state.voiceConnection?.dispatcher?.resume();
    state.voiceConnection?.dispatcher?.pause();
    state.voiceConnection?.dispatcher?.resume();
    this.emit(
      'pause',
      `Player music is resumed, in <#${state.voiceConnection.channel.id}>`,
      guild,
      state.logsChannel,
    );
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
    if (!state)
      throw new Error('Guild are not initialized. Please use init command');
    if (state.voiceChannelID) {
      voiceChannel ==
        this._provider.client.channels.cache.get(state.voiceChannelID);
    } else if (!voiceChannel) {
      textChannel.send('Please join voice channel !');
    }

    try {
      const connection = await voiceChannel.join();
      state.voiceChannelID = voiceChannel.id;
      state.voiceConnection = connection;
      return connection;
    } catch (e) {
      console.log(e);

      throw e;
    }
  }

  async isJoinnableChannel() {}
}
