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
    const youtube = this.client.youtube;
    const music = this.client.music;

    try {
      if (args.subCommand == 'init') {
        if (message.channel instanceof TextChannel) {
          music.intiGuild(message.guild, message.channel);
        }
      } else if (args.subCommand == 'set') {
        if (args.params == 'logchannel') {
          if (message.channel instanceof TextChannel) {
            music.setLogChannel(message.guild, message.channel);
          }
        } else if (args.params == 'textchannel') {
          if (message.channel instanceof TextChannel) {
            music.setTextChannel(message.guild, message.channel);
          }
        }
      } else if (args.subCommand == 'get') {
        if (args.params == 'logchannel') {
          if (message.channel instanceof TextChannel) {
            const channel = music.getLogChannel(message.guild);
            return message.say(`The logs channel is <#${channel.id}>`);
          }
        } else if (args.params == 'textchannel') {
          if (message.channel instanceof TextChannel) {
            const channel = music.getTextChannel(message.guild);
            return message.say(`The default channel is <#${channel.id}>`);
          }
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
