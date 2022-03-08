import { BaseBotParams } from '../bot.types';

export type MessageReplyParams = BaseBotParams & {
  content: string;
  ephemeral?: boolean;
  timeout?: number;
};
