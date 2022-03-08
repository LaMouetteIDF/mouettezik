import { Injectable } from '@nestjs/common';
import { WorkerService } from '../worker/worker.service';
import { Collection } from 'discord.js';
import { VoiceState, VoiceWorker } from '@/features/bot/voice/voiceWorker';
import { PlaylistService } from '@/features/bot/playlist/playlist.service';

type GuildId = string;

type WorkerId = string;

type GuildCollection = Collection<WorkerId, VoiceWorker>;

@Injectable()
export class VoiceService {
  private readonly _guilds = new Collection<GuildId, GuildCollection>();
  private readonly _leaveChannelTimer = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly workerService: WorkerService,
    private readonly playlistService: PlaylistService,
  ) {}

  private getAvailableWorkerId(guildId: string) {
    const unavailableWorkerIds = Array.from(this.getGuild(guildId).keys());

    const workerIds = this.workerService.workerIds.filter(
      (workerId) => unavailableWorkerIds.indexOf(workerId) < 0,
    ); // a faire:  Verifier les workers dans la guild !!!

    if (workerIds.length == 0) return undefined;
    return workerIds.shift();
  }

  private getGuild(guildId: string) {
    let guild = this._guilds.get(guildId);
    if (!guild) {
      guild = new Collection<WorkerId, VoiceWorker>();
      this._guilds.set(guildId, guild);
    }
    return guild;
  }

  private async currentOrNewVoiceWorker(guildId: string, channelId: string) {
    let voiceWorker = this.getVoiceWorkerByChannel(guildId, channelId);
    if (!voiceWorker) {
      const availableWorkerId = this.getAvailableWorkerId(guildId);
      if (!availableWorkerId) throw new Error('no worker available');
      const worker = this.workerService.getWorkerById(availableWorkerId);
      voiceWorker = await new VoiceWorker(
        guildId,
        channelId,
        worker,
        this.playlistService,
      ).init();

      const guild = this.getGuild(guildId);
      guild.set(availableWorkerId, voiceWorker);
    }
    return voiceWorker;
  }

  public async play(
    guildId: string,
    channelId: string,
    playlistId?: string,
    track?: number,
  ): Promise<void> {
    const voiceWorker = await this.currentOrNewVoiceWorker(guildId, channelId);
    if (playlistId) await voiceWorker.setPlaylist(playlistId, track);
    if (!playlistId && voiceWorker.state == VoiceState.Idle)
      throw new Error('missing playlist');
    await voiceWorker.play();
  }

  public pause(guildId: string, channelId: string): boolean {
    const voiceWorker = this.getVoiceWorkerByChannel(guildId, channelId);
    return voiceWorker ? voiceWorker.pause() : false;
  }

  public stop(guildId: string, channelId: string): boolean {
    const voiceWorker = this.getVoiceWorkerByChannel(guildId, channelId);
    return voiceWorker ? voiceWorker.stop() : false;
  }

  public getVoiceWorkerByChannel(
    guildId: string,
    channelId: string,
  ): VoiceWorker | undefined {
    if (!this._guilds.has(guildId)) return undefined;
    const guild = this.getGuild(guildId);
    return guild.find((voiceWorker) => voiceWorker.channelId === channelId);
  }

  public getCurrentPlaylistInVoiceChannel(guildId: string, channelId: string) {
    const voiceWorker = this.getVoiceWorkerByChannel(guildId, channelId);
    if (!voiceWorker) return undefined;
    return {
      playlist: voiceWorker.playlist,
      track: voiceWorker.track,
    };
  }

  public async onGuildVoiceStateUpdate(guildId: string, channelId: string) {
    const voiceWorker = this.getVoiceWorkerByChannel(guildId, channelId);
    if (!voiceWorker) return;
    const workerId = voiceWorker.workerId;
    const client = this.workerService.mainWorker.getWorkerClient();
    if (!client) return;
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isVoice()) return;
    const members = Array.from(channel.members.keys());
    if (members.indexOf(voiceWorker.workerId) < 0) return;
    if (members.length <= 1) {
      this._leaveChannelTimer.set(
        channelId,
        setTimeout(() => {
          voiceWorker.destroy();
          console.log('destroy');
          this.getGuild(guildId).delete(workerId);
        }, 5 * 60 * 1_000),
      );
    } else {
      clearTimeout(this._leaveChannelTimer.get(channelId));
    }
  }
}
