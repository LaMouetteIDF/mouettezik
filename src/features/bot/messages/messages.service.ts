import { Injectable } from '@nestjs/common';
import { MessageReplyParams } from './messages.types';

@Injectable()
export class MessagesService {
  public async reply(params: MessageReplyParams) {
    if (
      params.ctx.interaction &&
      (params.ctx.interaction.isCommand() || params.ctx.interaction.isButton())
    ) {
      void (await params.ctx.interaction.reply({
        fetchReply: true,
        ephemeral: params.ephemeral,
        content: params.content,
      }));
    }
  }
}
