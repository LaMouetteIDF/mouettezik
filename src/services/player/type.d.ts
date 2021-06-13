import { TextChannel, VoiceChannel, VoiceConnection } from 'discord.js';
import { CommandoGuild } from 'discord.js-commando';

interface PlayerEvents {
  play: [text: string, guild: CommandoGuild, channel: TextChannel];
  // play: [string, CommandoGuild, TextChannel];
}

export interface PlayerState {
  textChannelID: string;
  textChannel: TextChannel;
  logsChannelID: string | null;
  logsChannel: TextChannel | null;
  voiceChannelID: string;
  voiceConnection: VoiceConnection | null;
  volume: number; // volume 0 - 100
  currentPlayingTime: number; // current song timer
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
  thumbnail: string;
}
