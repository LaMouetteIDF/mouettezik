import { Client, ClientOptions, Intents } from 'discord.js';

export type WorkerOptions = {
  type: WorkerType;
  clientOptions?: ClientOptions;
};

export enum WorkerType {
  Main = 'main',
  Worker = 'worker',
}

const DEFAULT_CLIENT_OPTIONS = {
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
};

export class Worker {
  private readonly _client: Client<true>;

  private readonly _type: WorkerType;

  get id() {
    return this._client.user.id;
  }

  get type() {
    return this._type;
  }

  get tag() {
    return this._client.user.tag;
  }

  get guilds() {
    return this._client.guilds.fetch();
  }

  constructor(options: WorkerOptions) {
    this._type = options.type;
    this._client = new Client(options.clientOptions ?? DEFAULT_CLIENT_OPTIONS);
  }

  public getWorkerClient() {
    return this._client;
  }

  async login(token: string) {
    await this._client.login(token);
    return token;
  }

  public async getGuilds() {
    return await this._client.guilds.fetch();
  }

  public async getGuild(guildId: string) {
    return await this._client.guilds.fetch(guildId);
  }

  public async getGuildVoiceAdaptor(guildId: string) {
    const guild = await this.getGuild(guildId);
    return guild.voiceAdapterCreator;
  }

  static async new(type: WorkerType, token: string, options?: WorkerOptions) {
    const client = new Worker({
      ...options,
      type: type,
    });
    await client.login(token);
    return client;
  }
}
