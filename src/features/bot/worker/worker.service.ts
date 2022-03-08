import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Worker, WorkerType } from './worker';
import { NewWorkerOptions } from './worker.types';
import { Collection } from 'discord.js';

@Injectable()
export class WorkerService implements OnApplicationShutdown {
  private _workers = new Collection<string, Worker>();

  private static async _newWorker(options: NewWorkerOptions) {
    return await Worker.new(options.type, options.token);
  }

  get workers() {
    return Array.from(this._workers.values());
  }

  get workerIds() {
    return Array.from(this._workers.keys());
  }

  get mainWorker() {
    return Array.from(this._workers.values()).find(
      (worker) => worker.type === WorkerType.Main,
    );
  }

  public async add(options: NewWorkerOptions | NewWorkerOptions[]) {
    if (Array.isArray(options)) {
      const workers = await Promise.all(
        options.map((option) => WorkerService._newWorker(option)),
      );
      workers.forEach((item) => {
        this._workers.set(item.id, item);
      });
      return workers;
    } else {
      const worker = await WorkerService._newWorker(options);
      this._workers.set(worker.id, worker);
      return [worker];
    }
  }

  public getWorkerById(workerId: string) {
    return this._workers.get(workerId);
  }

  public async getWorkersInGuildId(guildId: string): Promise<Worker[]> {
    return this.workers.filter(async (worker) => {
      try {
        await worker.getWorkerClient().guilds.fetch(guildId);
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    });
  }

  public async getMainWorkerGuild() {
    const oauth2Guilds = await this.mainWorker.getGuilds();
    return Promise.all(oauth2Guilds.map((oauth2Guild) => oauth2Guild.fetch()));
  }

  public async getGuildMainWorker(guildId: string) {
    return this.mainWorker?.getGuild(guildId);
  }

  onApplicationShutdown(signal: string) {
    console.log(signal); // e.g. "SIGINT"
    this.workers.forEach((worker) => worker.getWorkerClient().destroy());
  }
}
