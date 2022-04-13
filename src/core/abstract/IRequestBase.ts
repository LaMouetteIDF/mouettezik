import { Interaction } from 'discord.js';

export abstract class IRequestBase<Req extends Interaction = Interaction> {
  protected constructor(public readonly raw: Req) {}

  get defer() {
    return (this.raw.isCommand() || this.raw.isButton()) && !this.raw.deferred
      ? this.raw.deferReply({ ephemeral: true })
      : undefined;
  }

  async userVoiceChannel() {
    return await this.raw.guild.members
      .fetch(this.raw.user.id)
      .then(({ voice }) => voice.channel);
  }

  async send(content: string) {
    await this._send(content);
  }

  async sendError(err: Error) {
    await this._send(`Error: ${err.message}`);
  }

  abstract sendNotFound(): void;

  private async _send(content: string, ephemeral = true) {
    const { raw } = this;
    if (raw.isCommand() || raw.isButton()) {
      if (raw.replied || raw.deferred)
        await raw.followUp({ content, ephemeral });
      else await raw.reply({ content, ephemeral });
    }
  }
}
