import { Client } from 'discord.js';

export abstract class IWorkerRuntime {
  protected constructor(protected readonly conn: Client<true>) {}

  get id(): string {
    const { user } = this.conn;
    return user.id;
  }

  get tag(): string {
    const { user } = this.conn;
    return user.tag;
  }

  get raw(): Client<true> {
    return this.conn;
  }

  disconnect(): void {
    this.conn.destroy();
  }
}
