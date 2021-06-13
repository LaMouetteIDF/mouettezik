import { Message } from 'discord.js';
import {
  ArgumentCollectorResult,
  Command,
  CommandoClient,
  CommandoMessage,
} from 'discord.js-commando';

export class Stop extends Command {
  private _initListeners: any;
  constructor(client: CommandoClient) {
    super(client, {
      name: 'stop',
      // aliases: ['listen', 'stream'],
      group: 'music',
      memberName: 'stop',
      description: 'Stop player',
      examples: ['stop'],
      guildOnly: true,
      clientPermissions: ['CONNECT', 'SPEAK'],
      argsType: 'multiple',
    });
  }
  public run(
    message: CommandoMessage,
    args: string | object | string[],
    fromPattern: boolean,
    result?: ArgumentCollectorResult<object>,
  ): Promise<Message | Message[]> {
    this.client.provider.set(message.guild, args[0], args[1]);

    return message.say('OK');
  }
}
