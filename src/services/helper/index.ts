import { Message, TextChannel } from 'discord.js';

export class Helper {
  static async constructLoadingMessage(
    message: Message,
    append = '.',
    maxLen = 150,
  ) {
    try {
      message = await message.channel.messages.fetch(message.id);
      if (message && message.deletable) {
        let content = message.content + append;
        if (content.length >= maxLen) content = append;

        if (message.editable) {
          message = await message.edit(content);
          setTimeout(async function () {
            await Helper.constructLoadingMessage(message, append, maxLen);
          }, 1100);
        }
      }
      return message;
    } catch (error) {
      return message;
    }
  }
}
