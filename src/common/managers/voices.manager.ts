import { Injectable } from '@nestjs/common';
import { Collection } from 'discord.js';

import { CommonService } from '../common.service';
import { Voice, VoiceState } from 'core/player/Voice';
import { WorkersManager } from './workers.manager';
import { Worker } from 'core/Worker';
import { VoiceStatus } from 'core/enums/VoiceStatus';
import { SnowflakeUtil } from 'discord.js';
import { TypedEmitter } from 'tiny-typed-emitter';
import { joinVoiceChannel } from '@discordjs/voice';

export type VoiceManagerEvents = {
  stateChange: (oldState: VoiceState, newState: VoiceState) => void;
};

@Injectable()
export class VoicesManager extends TypedEmitter<VoiceManagerEvents> {
  constructor(
    private readonly coreService: CommonService,
    private readonly workersManager: WorkersManager,
  ) {
    super();
    coreService.client.on(
      'voiceStateUpdate',
      this._onVoiceStateChangeInMainClient,
    );
  }

  private _voices = new Collection<string, Voice>();

  public get voices() {
    return this._voices;
  }

  public get client() {
    return this.coreService.client;
  }

  public get workers() {
    return this.workersManager.workers;
  }

  async newVoice(channelId: string) {
    const voice = this._findByChannelId(channelId);
    return voice ?? (await this._newVoice(channelId));
  }

  private async _newVoice(channelId: string) {
    const channel = await this.client.channels.fetch(channelId);
    if (!channel.isVoice()) throw new Error('is not voice channel');

    const availableWorkers = await this._getAvailableWorkers(channel.guildId);
    if (!availableWorkers.length) throw new Error('no available worker');

    let worker: Worker;

    for (const availableWorker of availableWorkers) {
      const permission = channel.permissionsFor(availableWorker.id);
      if (!permission.has('CONNECT')) continue;
      if (!permission.has('SPEAK')) continue;
      worker = availableWorker;
    }

    if (!worker) throw new Error('cannot join this channel');
    const adapter = await worker.getVoiceAdapter(channel.guildId);
    if (!adapter) throw new Error('adapter not found');

    const connection = joinVoiceChannel({
      guildId: channel.guildId,
      channelId,
      adapterCreator: adapter,
      group: worker.id,
      selfMute: false,
      selfDeaf: true,
    });

    const voice = new Voice(this.coreService, worker, connection, {
      id: SnowflakeUtil.generate(),
      guildId: channel.guildId,
      channelId,
      status: VoiceStatus.Idle,
      speakingTime: 0,
    });

    this._registerVoice(voice);

    await voice.connect();

    return voice;
  }

  private _registerVoice(voice: Voice) {
    this._voices.set(voice.id, voice);

    voice.on('stateChange', this._onVoiceStateChange);

    voice.once('destroy', () => {
      this._voices.delete(voice.id);

      voice.removeListener('stateChange', this._onVoiceStateChange);
    });
  }

  private async _getAvailableWorkers(guildId: string): Promise<Worker[]> {
    const currentWorkerIdInGuild: string[] = this._voices
      .filter(({ state }) => state.guildId === guildId)
      .map(({ worker }) => worker.id);

    const workerInGuild: Worker[] = [];
    for (const worker of this.workers.values()) {
      if (
        !currentWorkerIdInGuild.includes(worker.id) &&
        (await worker.inGuild(guildId))
      )
        workerInGuild.push(worker);
    }

    return workerInGuild;
  }

  private _findByChannelId(id: string) {
    return this._voices.find(({ state: { channelId } }) => channelId === id);
  }

  private _onVoiceStateChange = async (
    oldState: VoiceState,
    newState: VoiceState,
  ) => {
    if (oldState.channelId !== newState.channelId) {
      const newChannel = await newState.voice.worker.raw.channels.fetch(
        newState.channelId,
      );
      if (newChannel.isVoice()) {
        const workersIds = Array.from(this.coreService.workers.keys());

        const allBotInChannel = newChannel.members.filter(
          ({ user }) => user.bot && user.id != newState.voice.worker.id,
        );

        const hasOtherWorker = allBotInChannel.some(({ user: { id } }) =>
          workersIds.includes(id),
        );

        if (hasOtherWorker) newState.voice.pause();
      }
    }
    this.emit('stateChange', oldState, newState);
  };

  private _onVoiceStateChangeInMainClient = (...any: any[]) => {
    // console.log('MAIN CLIENT voice CHANGE STATE !!!! ------', any);
  };
}
