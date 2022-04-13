import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Collection } from 'discord.js';

import { CommonService } from '../common.service';
import { Worker } from 'core/Worker';

@Injectable()
export class WorkersManager {
  private readonly _workers = new Collection<string, Worker>();

  constructor(
    private readonly configService: ConfigService,
    private readonly coreService: CommonService,
  ) {
    coreService.client.once('ready', () => {
      this._startWorkers().catch(console.warn);
    });
  }

  get client() {
    return this.coreService.client;
  }

  get workers() {
    return this._workers;
  }

  private async _startWorkers() {
    const workersTokens =
      this.configService
        .get<string>('KSPLAYER_WORKERS_TOKENS')
        ?.trim()
        .replaceAll('"', '')
        .split(',') ?? [];

    let count = 1;

    for (const token of [...new Set(workersTokens)]) {
      const workerClient = new Client({
        intents: ['GUILDS', 'GUILD_VOICE_STATES'],
      });

      try {
        await workerClient.login(token);
        console.log(`worker ${workerClient.user.tag} loaded!`);
      } catch (e) {
        if (e.code == 'TOKEN_INVALID') {
          console.error(`Invalid worker (${count}) token!`);
        } else console.error(e);

        process.exit(1);
      }
      this._workers.set(
        workerClient.user.id,
        new Worker(this.coreService, workerClient),
      );
      count++;
    }
    this._workers.set(
      this.client.user.id,
      new Worker(this.coreService, this.client),
    );
    console.log(`worker ${this.client.user.tag} loaded!`);
  }

  // onModuleInit() {
  //   return new Promise<void>((resolve, reject) => {
  //     this.client.once('ready', async (client) => {
  //       const workersTokens =
  //         this.configService
  //           .get<string>('KSPLAYER_WORKERS_TOKENS')
  //           ?.trim()
  //           .split(',') ?? [];
  //
  //       let count = 1;
  //
  //       for (const token of [...new Set(workersTokens)]) {
  //         const workerClient = new Client({
  //           intents: ['GUILDS', 'GUILD_VOICE_STATES'],
  //         });
  //
  //         try {
  //           await workerClient.login(token);
  //           console.log(`worker ${workerClient.user.tag} loaded!`);
  //         } catch (e) {
  //           if (e.code == 'TOKEN_INVALID') {
  //             console.error(`Invalid worker (${count}) token!`);
  //           } else console.error(e);
  //
  //           process.exit(1);
  //         }
  //         this._workers.set(
  //           workerClient.user.id,
  //           new Worker(this.coreService, workerClient),
  //         );
  //         count++;
  //       }
  //       this._workers.set(client.user.id, new Worker(this.coreService, client));
  //       console.log(`worker ${client.user.tag} loaded!`);
  //       resolve();
  //     });
  //   });
  // }
}
