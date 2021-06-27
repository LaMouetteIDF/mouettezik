import {
  StreamDispatcher,
  TextChannel,
  VoiceChannel,
  VoiceConnection,
} from 'discord.js';
import { CommandoGuild, SQLiteProvider } from 'discord.js-commando';
import { FfmpegCommand } from 'fluent-ffmpeg';

interface PlayerEvents {
  play: [text: string, guild: CommandoGuild, channel: TextChannel];
  pause: [text: string, guild: CommandoGuild, channel: TextChannel];
  config: [text: string, guild: CommandoGuild, channel: TextChannel];
  // play: [string, CommandoGuild, TextChannel];
}

export interface PlayerState {
  /**
   * if textChannelID has been defined lock textChannel
   */
  textChannelID?: string;

  /**
   * if logsChannelID has been defined lock logsChannel
   */
  logsChannelID?: string;

  /**
   * if voiceChannelID has been defined lock voiceChannel
   */
  voiceChannelID?: string;

  textChannel: TextChannel;
  logsChannel: TextChannel;
  voiceConnection?: VoiceConnection;
  ffmpeg?: FfmpegCommand;
  dispatch?: StreamDispatcher;

  /**
   * the volume value must be between 0 and 100
   */
  volume: number;

  /**
   * current music playing time position
   */
  curPosPlayingTime: number;

  /**
   * Playing is the current playing state
   */
  playing: boolean;
  timer?: { newTimer: () => void; clearTimer: () => void };
}

export interface PlayerQueue {
  potition: number;
  tracks: Tracks;
}

export type Tracks = Array<Track>;

export interface Track {
  title: string;
  url: string;
  startTime: number;
  thumbnail: string;
}
