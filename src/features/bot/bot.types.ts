import { Interaction } from 'discord.js';

export type CTX = Record<string, any> & {
  interaction?: Interaction;
};

export type BaseBotParams = {
  ctx: CTX;
};
