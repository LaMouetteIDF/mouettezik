import { ButtonInteraction, CommandInteraction, Interaction } from 'discord.js';

import { HandleStore } from 'core/store/HandleStore';
import { IRequestBase } from 'core/abstract/IRequestBase';
import { CommandRequest } from 'core/request/CommandRequest';
import { ButtonRequest } from 'core/request/ButtonRequest';

import { HandleFunction } from 'utils/handle/HandlerTypes';

export class InteractionRouter {
  constructor(private readonly store: HandleStore) {}

  public readonly onInteractionCreate = async (interaction: Interaction) => {
    return await this._onInteraction(interaction);
  };

  private async _handleCommand(req: CommandRequest): Promise<void> {
    const { command, subCommand, subCommandGroup } = req;
    let handle: HandleFunction;

    if (req.subCommandGroup) {
      handle = this.store.getHandleCommand(
        command,
        subCommandGroup,
        subCommand,
      );
    } else if (subCommand) {
      handle = this.store.getHandleCommand(command, subCommand);
    } else {
      handle = this.store.getHandleCommand(command);
    }

    if (!handle) return req.sendNotFound();

    return await handle(req);
  }

  private async _onInteraction(interaction: Interaction) {
    if (!interaction.inGuild()) return;
    let req: IRequestBase;
    let res: any;

    try {
      if (
        interaction.isCommand() &&
        interaction instanceof CommandInteraction
      ) {
        res = await this._handleCommand(
          (req = new CommandRequest(interaction)),
        );
      } else if (
        interaction.isButton() &&
        interaction instanceof ButtonInteraction
      ) {
        const buttonHandle = this.store.getHandleButton(interaction.customId);
        req = new ButtonRequest(interaction, buttonHandle?.payload);
        if (!buttonHandle) return req.sendNotFound();
        res = await buttonHandle.handle(req);
      }

      if (typeof res === 'string') req?.send(res).catch(console.warn);
    } catch (e) {
      if (e instanceof Error) {
        req?.sendError(e).catch(console.warn);
      } else {
        console.error(e);

        req?.send('internal Error').catch(console.warn);
      }
    }
  }
}
