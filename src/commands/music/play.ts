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
  ytURL: string;
};

export class Play extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'play',
      aliases: ['listen', 'stream'],
      group: 'music',
      memberName: 'play',
      description: 'Plays loaded queue',
      examples: ['play', 'play <YOUTUBE-URL>'],
      guildOnly: true,
      clientPermissions: ['CONNECT', 'SPEAK'],
      args: [
        {
          key: 'ytURL',
          prompt: 'Youtube URL',
          type: 'string',
        },
      ],
    });

    this._initListeners();
  }

  public async run(
    message: CommandoMessage,
    args: Args,
    _fromPattern: boolean,
    _result?: ArgumentCollectorResult<object>,
  ): Promise<Message | Message[]> {
    const youtube = this.client.youtube;
    const music = this.client.music;

    //console.log(await youtube.getInfo(args.ytURL));

    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) return message.reply('join voice channel please!');

    console.log(message.guild.me?.voice.connection);

    // if (!message.guild.me?.voice && message.channel instanceof TextChannel)
    //   music.joinChannel(message.guild, message.channel, voiceChannel);

    if (
      !message.guild.me?.voice.connection &&
      message.channel instanceof TextChannel
    )
      await music.joinChannel(message.guild, message.channel, voiceChannel);

    console.log(message.guild.me?.voice.connection);

    // try {
    //   const connection = await voiceChannel.join();
    //   const dispatch = connection.play(
    //     await youtube.getAudioStream(args.ytURL),
    //   );
    //   dispatch.setVolume(50 / 100);

    //   console.log();

    //   return message.reply('OK');
    // } catch (e) {
    //   message.reply('Sorry i have a problem!');
    //   console.log(e);
    //   throw e;
    // }
  }

  private _initListeners() {
    this.client.music.on('play', (text, _guild, channel) => {
      channel.send(text);
    });
  }
}
