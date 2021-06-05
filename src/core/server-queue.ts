import Discord, {
  Message,
  TextChannel,
  DMChannel,
  NewsChannel,
  VoiceChannel,
} from 'discord.js';
import { Music } from '../music';

export const Queue = new Map<string, ServerQueue>();

export class ServerQueue {
  textChannel: TextChannel | DMChannel | NewsChannel;
  voiceChannel: VoiceChannel;
  music?: Music;

  constructor(message: Message) {
    this.textChannel = message.channel;
    if (message.member?.voice.channel)
      this.voiceChannel = message.member?.voice.channel;
  }
}
