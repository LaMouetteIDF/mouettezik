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
  target: string;
};

export class Stream extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'stream',
      group: 'music',
      memberName: 'stream',
      description: 'Get audio live stream',
      examples: ['stream', 'steam <STREAM_URL>'],
      guildOnly: true,
      // clientPermissions: ['CONNECT', 'SPEAK'],
      args: [
        {
          key: 'target',
          prompt: 'Target',
          type: 'string',
          default: '',
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

    try {
      if (args.target) {
        await music.joinChannel(guild, channel, message.member?.voice.channel);

        const tracks = await download.getInfo(args.target);
        if (tracks.length > 1)
          throw new Error(
            'I have found many feeds from your url. Please use only one feed',
          );

        if (!tracks[0].live)
          throw new Error(
            'This order only accepts live streaming link. Please use the play command to play videos (e.g.: !play <VIDEO_URL>).',
          );

        music.playStream(guild, channel, tracks[0]);
      } else if (!args.target) {
        if (message.channel instanceof TextChannel) music.resume(message.guild);
      }
    } catch (e) {
      message.reply(`Error: \`${e.message}\``);
    }
  }

  private _initListeners() {
    this.client.music.on('stream', (text, _guild, channel) => {
      channel.send(text);
    });
  }
}
