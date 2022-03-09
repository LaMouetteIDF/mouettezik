import { Injectable } from '@nestjs/common';
import {
  AddPlayerOptions,
  ListPlayerOptions,
  PlayPlayerOptions,
  StopPlayerOptions,
} from './player.types';
import { MessagesService } from '../messages/messages.service';
import { WorkerService } from '../worker/worker.service';
import { VoiceService } from '../voice/voice.service';
import { Guild } from 'discord.js';
import Youtube from '@/utils/youtube';
import { CTX } from '@/features/bot/bot.types';
import { PlaylistService } from '@/features/bot/playlist/playlist.service';
import { InjectRepository } from '@nestjs/typeorm';
import { PlaylistEntity } from '@/infra/entities/playlist.entity';
import { Repository } from 'typeorm';
import { TrackEntity } from '@/infra/entities/track.entity';
import { VoiceChannelEntity } from '@/infra/entities/voiceChannel.entity';

async function getChannelIdOfUser(
  guild: Guild,
  userId: string,
): Promise<string> {
  const guildMember = await guild.members.fetch(userId);
  // if (!channelId) throw new Error('user is not connect in voice channel');
  return guildMember.voice.channelId;
}

@Injectable()
export class PlayerService {
  constructor(
    @InjectRepository(PlaylistEntity)
    private readonly playlistRepository: Repository<PlaylistEntity>,
    @InjectRepository(TrackEntity)
    private readonly trackRepository: Repository<TrackEntity>,
    @InjectRepository(VoiceChannelEntity)
    private readonly channelRepository: Repository<VoiceChannelEntity>,
    private readonly messagesService: MessagesService,
    private readonly workerService: WorkerService,
    private readonly voiceService: VoiceService,
    private readonly playlistService: PlaylistService,
  ) {}

  public async play(opts: PlayPlayerOptions) {
    if (opts.options.youtubeURL && !Youtube.isValid(opts.options.youtubeURL)) {
      return this.sendError(new Error('invalid params'), opts.ctx);
    }

    const guildId = opts.guildId;
    const params = Object.assign({}, opts.options);

    try {
      const channelId = await getChannelIdOfUser(
        await this.workerService.getGuildMainWorker(opts.guildId),
        opts.userId,
      );

      if (!channelId)
        return this.sendError(new Error('user not in voice channel'), opts.ctx);

      if (params.youtubeURL) {
        const track = await this.playlistService.newTrackFromUrl(
          params.youtubeURL,
        );
        await this.voiceService.playTrack(guildId, channelId, track);
        return await this.replyMessage(`Play...! ${track.title}`, opts.ctx);
      }

      switch (true) {
        case !!params.track && !params.playlist && !params.youtubeURL: {
          const currentPlaylistState =
            this.voiceService.getCurrentPlaylistInVoiceChannel(
              guildId,
              channelId,
            );
          if (!currentPlaylistState)
            return this.sendError(new Error('no current playlist'), opts.ctx);
          params.playlist = currentPlaylistState.playlist;
          break;
        }

        case !!params.youtubeURL: {
          const currentPlaylistState =
            this.voiceService.getCurrentPlaylistInVoiceChannel(
              guildId,
              channelId,
            );
          if (
            (currentPlaylistState &&
              !(await this.playlistService.isEphemeral(
                currentPlaylistState.playlist,
              ))) ||
            !currentPlaylistState
          ) {
            const playlist = await this.playlistService.newEphemeralPlaylist(
              guildId,
              'ephemeral',
            );
            params.playlist = playlist.id;
          } else params.playlist = currentPlaylistState.playlist;
          const track = await this.playlistService.addTrackByURL(
            params.playlist,
            params.youtubeURL,
          );
          let trackIndex = await this.playlistService.getIndexOfTrackInPlaylist(
            track.id,
          );
          if (trackIndex < 0)
            return this.sendError(new Error('internal error'), opts.ctx);
          params.track = ++trackIndex;
          break;
        }

        case !!params.playlist: {
          const playlist = await this.playlistService.getPlaylist(
            params.playlist,
          );
          if (!playlist || playlist.guildId !== guildId)
            return this.sendError(new Error('playlist is not found'), opts.ctx);

          if (params.track <= 0 || playlist.tracksOrder.length < params.track)
            return this.sendError(new Error('invalid track'), opts.ctx);
        }
      }

      await this.voiceService.play(
        guildId,
        channelId,
        params.playlist,
        params.track,
      );

      return await this.replyMessage('Pause music...', opts.ctx);
    } catch (e) {
      console.error(e);
      return this.sendError(e, opts.ctx);
    }
  }

  public async pause(opts: StopPlayerOptions) {
    try {
      const userChannelId = await getChannelIdOfUser(
        await this.workerService.getGuildMainWorker(opts.guildId),
        opts.userId,
      );

      if (!userChannelId)
        return this.sendError(new Error('not authorized'), opts.ctx);

      this.voiceService.pause(opts.guildId, userChannelId);

      return await this.replyMessage('Pause music...', opts.ctx);
    } catch (e) {
      console.error(e);
      return this.sendError(e, opts.ctx);
    }
  }

  public async add(opts: AddPlayerOptions) {
    if (!Youtube.isValid(opts.options.youtubeURL))
      return this.sendError(new Error('invalid url'), opts.ctx);

    try {
      const guildId = opts.guildId;
      const params = Object.assign({}, opts.options);

      if (!params.playlist) {
        const userChannelId = await getChannelIdOfUser(
          await this.workerService.getGuildMainWorker(opts.guildId),
          opts.userId,
        );

        if (!userChannelId) {
          return this.sendError(
            new Error('user not in voice channel'),
            opts.ctx,
          );
        }

        const track = await this.playlistService.newTrackFromUrl(
          params.youtubeURL,
        );
        await this.voiceService.addInQueue(guildId, userChannelId, track);
        return;
      }

      const playlist = await this.playlistService.getPlaylist(params.playlist);

      if (!playlist)
        return this.sendError(new Error('invalid playlist'), opts.ctx);

      const track = await this.playlistService.addTrackByURL(
        params.playlist,
        params.youtubeURL,
      );

      return await this.replyMessage(
        `Add music "${track.title}" in "${playlist.name}" playlist`,
        opts.ctx,
      );
    } catch (e) {
      console.error(e);
      return this.sendError(e, opts.ctx);
    }
  }

  public async list(opts: ListPlayerOptions) {
    const params = Object.assign({}, opts.options);
    try {
      const userChannelId = await getChannelIdOfUser(
        await this.workerService.getGuildMainWorker(opts.guildId),
        opts.userId,
      );

      if (!userChannelId && !params.playlist)
        return this.sendError(new Error('no current playlist'), opts.ctx);

      if (!params.playlist) {
        const currentPlaylistState =
          this.voiceService.getCurrentPlaylistInVoiceChannel(
            opts.guildId,
            userChannelId,
          );
        if (!currentPlaylistState)
          return this.sendError(new Error('no current playlist'), opts.ctx);
        params.playlist = currentPlaylistState.playlist;
      }

      const list = await this.playlistService.getPlaylistAndTracks(
        params.playlist,
      );
      return this.replyMessage(this._makeReplyPlaylist(list), opts.ctx);
    } catch (e) {
      console.error(e);
      return this.sendError(e, opts.ctx);
    }
  }

  public async stop(opts: StopPlayerOptions) {
    try {
      const userChannelId = await getChannelIdOfUser(
        await this.workerService.getGuildMainWorker(opts.guildId),
        opts.userId,
      );

      if (!userChannelId)
        return this.sendError(new Error('Join voice channel!'), opts.ctx);

      this.voiceService.stop(opts.guildId, userChannelId);

      return await this.replyMessage('Stop music...', opts.ctx);
    } catch (e) {
      console.error(e);
      return this.sendError(e, opts.ctx);
    }
  }

  private async sendError(
    error: Error,
    ctx: CTX,
    timeout?: number,
  ): Promise<void> {
    return await this.messagesService.reply({
      content: `Error: ${error.message}`,
      ctx,
      ephemeral: true,
      timeout,
    });
  }

  private async replyMessage(
    content: string,
    ctx: CTX,
    timeout?: number,
  ): Promise<void> {
    return await this.messagesService.reply({
      content,
      ctx,
      ephemeral: true,
      timeout,
    });
  }

  private _makeReplyPlaylist(playlist: {
    playlist: PlaylistEntity;
    tracks: TrackEntity[];
  }) {
    const render = [' ', `PLAYLIST: ${playlist.playlist.name}`];

    const tracks = playlist.playlist.tracksOrder.map((trackId, index) => {
      const track = playlist.tracks.find((track) => track.id === trackId);
      if (!track) return undefined;
      return `${index + 1} - ${track.title}`;
    });
    render.push(...tracks.filter((track) => !!track));
    return render.join('\n');
  }
}
