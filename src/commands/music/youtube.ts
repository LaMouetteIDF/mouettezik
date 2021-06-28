import { Message } from 'discord.js';
import {
  ArgumentCollectorResult,
  Command,
  CommandoClient,
  CommandoMessage,
} from 'discord.js-commando';

type Args = {
  subCommand: string;
  target: string;
};

export class Youtube extends Command {
  private _initListeners: any;
  constructor(client: CommandoClient) {
    super(client, {
      name: 'yt',
      // aliases: ['listen', 'stream'],
      group: 'music',
      memberName: 'youtube',
      description: 'Youtube player',
      examples: ['yt play <YOUTUBE-URL>', 'yt add <YOUTUBE-URL>'],
      guildOnly: true,
      clientPermissions: ['CONNECT', 'SPEAK'],
      args: [
        {
          key: 'subCommand',
          prompt: 'Sub-command',
          type: 'string',
          default: '',
        },
        {
          key: 'target',
          prompt: 'Target',
          type: 'string',
          default: '',
        },
      ],
    });
  }
  public async run(
    message: CommandoMessage,
    args: Args,
    fromPattern: boolean,
    result?: ArgumentCollectorResult<object>,
  ): Promise<Message | Message[]> {
    return;
  }
}
