import { Message, TextChannel } from 'discord.js';
import {
  ArgumentCollectorResult,
  Command,
  CommandoClient,
  CommandoMessage,
} from 'discord.js-commando';

export class Stop extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'stop',
      // aliases: ['listen', 'stream'],
      group: 'music',
      memberName: 'stop',
      description: 'Stop player',
      examples: ['stop'],
      guildOnly: true,
      // clientPermissions: ['CONNECT', 'SPEAK'],
      argsType: 'multiple',
    });

    try {
      this._initListeners();
    } catch (e) {
      console.log('Failed to initialize PlayCommand listeners', e);
    }
  }

  public run(
    message: CommandoMessage,
    args: string | object | string[],
    fromPattern: boolean,
    result?: ArgumentCollectorResult<object>,
  ): Promise<Message | Message[]> {
    const download = this.client.download;
    const music = this.client.music;

    const guild = message.guild;

    let channel: TextChannel;
    if (message.channel instanceof TextChannel) {
      channel = message.channel;
    } else return;

    try {
      music.stop(guild);
    } catch (e) {
      message.reply(`Error: \`${e.message}\``);
    }
  }

  private _initListeners() {
    this.client.music.on('stop', (text, _guild, channel) => {
      channel.send(text);
    });
  }
}
