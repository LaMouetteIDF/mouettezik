import { ButtonInteraction } from 'discord.js';

import { IRequestBase } from '../abstract/IRequestBase';

export class ButtonRequest extends IRequestBase<ButtonInteraction> {
  constructor(req: ButtonInteraction, public readonly playload?: string) {
    super(req);
  }

  sendNotFound() {
    this.send('button not implement').catch(console.warn);
  }
}
