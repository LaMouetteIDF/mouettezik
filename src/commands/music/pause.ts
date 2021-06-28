import { Youtube } from '@/services/download/youtube';
import { Message, MessageEmbed, TextChannel, VoiceChannel } from 'discord.js';
import { SQLiteProvider } from 'discord.js-commando';
import {
  ArgumentCollectorResult,
  Command,
  CommandoClient,
  CommandoMessage,
} from 'discord.js-commando';

export class Pause extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'pause',
      group: 'music',
      memberName: 'pause',
      description: 'Pause current playing music',
      examples: ['pause'],
      guildOnly: true,
      // clientPermissions: ['CONNECT', 'SPEAK'],
    });

    try {
      this._initListeners();
    } catch (e) {
      console.log('Failed to initialize PlayCommand listeners', e);
    }
  }

  async run(
    message: CommandoMessage,
    args: string,
    _fromPattern: boolean,
    _result?: ArgumentCollectorResult<object>,
  ): Promise<Message | Message[]> {
    const download = this.client.download;
    const music = this.client.music;

    try {
      music.pause(message.guild);
    } catch (e) {
      console.log(e);

      throw e;
    }
    return;
  }

  private _initListeners() {
    this.client.music.on('pause', (text, _guild, channel) => {
      channel.send(text);
    });
  }
}
