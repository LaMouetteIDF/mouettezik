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
  subCommand: string;
  params: string;
  value: string;
};

export class Config extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'config',
      group: 'sys',
      memberName: 'config',
      description: 'Config set or get params of guild',
      examples: [
        'config init',
        'config set <PARAMS> [VALUE]',
        'config get <PARAMS>',
      ],
      guildOnly: true,
      args: [
        {
          key: 'subCommand',
          prompt: 'Sub-command',
          type: 'string',
          default: '',
        },
        {
          key: 'params',
          prompt: 'PARAMS',
          type: 'string',
          default: '',
        },
        {
          key: 'value',
          prompt: 'VALUE',
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
      if (args.subCommand == 'init') {
        music.setTextChannel(guild, channel);
        music.setLogChannel(guild, channel);
      } else if (args.subCommand == 'set') {
        if (args.params == 'logchannel') {
          music.setLogChannel(guild, channel);
        } else if (args.params == 'textchannel') {
          music.setTextChannel(message.guild, channel);
        }
      } else if (args.subCommand == 'get') {
        if (args.params == 'logchannel') {
          const channel = music.getLogChannel(guild);
          return message.say(`The logs channel is <#${channel.id}>`);
        } else if (args.params == 'textchannel') {
          const channel = music.getTextChannel(guild);
          return message.say(`The default channel is <#${channel.id}>`);
        }
      }
    } catch (e) {
      console.log(e);
      throw e;
    }

    return;
  }

  private _initListeners() {
    this.client.music.on('config', (text, _guild, channel) => {
      channel.send(text);
    });
  }
}