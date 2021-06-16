import { Message } from 'discord.js';
import {
  ArgumentCollectorResult,
  Command,
  CommandoClient,
  CommandoMessage,
} from 'discord.js-commando';

export class Youtube extends Command {
  private _initListeners: any;
  constructor(client: CommandoClient) {
    super(client, {
      name: 'yt',
      // aliases: ['listen', 'stream'],
      group: 'music',
      memberName: 'youtube',
      description: 'Youtube player',
      examples: ['yt <YOUTUBE-URL>'],
      guildOnly: true,
      clientPermissions: ['CONNECT', 'SPEAK'],
      argsType: 'single',
    });
  }
  public async run(
    message: CommandoMessage,
    args: string | object | string[],
    fromPattern: boolean,
    result?: ArgumentCollectorResult<object>,
  ): Promise<Message | Message[]> {
    const messages = [];

    try {
      let msg = message.say(
        `t'es sur que tu veux faire ça ??  Y (yes) / N (no):`,
      );
      messages.push(msg);
      message.channel
        .awaitMessages(
          (res) => {
            // console.log(res);
            return res.content === 'y' || res.content === 'n';
          },
          {
            max: 1,
            time: 30000,
            errors: ['time'],
          },
        )
        .then((collected) => {
          // console.log(collected);

          message.channel.send('The collected message was:' + collected);
        })
        .catch(() => {
          message.channel.send('There was no content collected.');
        });

      // if (message.channel.type !== 'dm')
      //   messages.push(
      //     message.reply('I have sent you a DM with further instructions.'),
      //   );
    } catch (err) {
      console.log(err);

      messages.push(
        message.reply(
          'Unable to send you a DM, you most likely have them disabled.',
        ),
      );
    }
    // return;
    return messages;
  }
}
