import { Youtube } from '@/services/download/youtube';
import { Message, MessageEmbed, TextChannel, VoiceChannel } from 'discord.js';
import { SQLiteProvider } from 'discord.js-commando';
import {
  ArgumentCollectorResult,
  Command,
  CommandoClient,
  CommandoMessage,
} from 'discord.js-commando';

type Args = {
  value?: number;
};

export class Volume extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'vol',
      aliases: ['volume'],
      group: 'music',
      memberName: 'volume',
      description: 'Set or get current volume',
      examples: ['vol', 'vol [number]', 'volume', 'volume [number]'],
      guildOnly: true,
      // clientPermissions: ['CONNECT', 'SPEAK'],
      args: [
        {
          key: 'value',
          prompt: 'Value',
          type: 'integer',
          default: -1,
        },
      ],
    });

    try {
      this._initListeners();
    } catch (e) {
      console.log('Failed to initialize PlayCommand listeners', e);
    }
  }

  async run(
    message: CommandoMessage,
    args: Args,
    _fromPattern: boolean,
    _result?: ArgumentCollectorResult<object>,
  ): Promise<Message | Message[]> {
    const download = this.client.download;
    const music = this.client.music;

    const guild = message.guild;

    let channel: TextChannel;
    if (message.channel instanceof TextChannel) {
      channel = message.channel;
    } else return;

    const volume = args.value >= 0 ? args.value : undefined;

    try {
      music.volume(guild, channel, volume);
    } catch (e) {
      console.log(e);
      throw e;
    }
    return;
  }

  private _initListeners() {
    this.client.music.on('volume', (text, _guild, channel) => {
      channel.send(text);
    });
  }
}
