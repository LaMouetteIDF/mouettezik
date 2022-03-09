import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlaylistEntity } from '@/infra/entities/playlist.entity';
import { TrackEntity } from '@/infra/entities/track.entity';
import { Collection } from 'discord.js';
import { VoiceChannelEntity } from '@/infra/entities/voiceChannel.entity';
import { generateSnowFlakeId } from '@utils/snowflackid';
import Youtube from '@utils/youtube';

@Injectable()
export class PlaylistService {
  private readonly _playlists = new Collection<string, PlaylistEntity>();
  private readonly _tracks = new Collection<string, TrackEntity>();

  constructor(
    @InjectRepository(VoiceChannelEntity)
    readonly voiceChannelRepository: Repository<VoiceChannelEntity>,
    @InjectRepository(PlaylistEntity)
    readonly playlistRepository: Repository<PlaylistEntity>,
    @InjectRepository(TrackEntity)
    readonly trackRepository: Repository<TrackEntity>,
  ) {}

  private async _newPlaylist(playlist: PlaylistEntity) {
    if (!playlist.tracksOrder) playlist.tracksOrder = [];
    if (!playlist.ephemeral) {
      playlist = await this.playlistRepository.save(playlist);
    }
    if (!playlist.id) playlist.id = generateSnowFlakeId();
    this._playlists.set(playlist.id, playlist);
    return playlist;
  }

  private async _savePlaylist(playlist: PlaylistEntity) {
    if (!playlist.ephemeral) {
      playlist = await this.playlistRepository.save(playlist);
      this._playlists.set(playlist.id, playlist);
    }
    return playlist;
  }

  private async _getPlaylist(playlistId: string) {
    let playlist = this._playlists.get(playlistId);
    if (!playlist) playlist = await this.playlistRepository.findOne(playlistId);
    return playlist;
  }

  private async _getTrack(trackId: string) {
    let track = this._tracks.get(trackId);
    if (!track) track = await this.trackRepository.findOne(trackId);
    return track;
  }

  private async _addTrack(track: TrackEntity) {
    const playlist = await this._getPlaylist(track.playlistId);
    if (!playlist) throw new Error('invalid playlist');
    if (!playlist.ephemeral) track = await this.trackRepository.save(track);
    if (!track.id) track.id = generateSnowFlakeId();
    this._tracks.set(track.id, track);
    playlist.tracksOrder.push(track.id);
    await this._savePlaylist(playlist);
    return track;
  }

  public async getPlaylist(playlistId: string) {
    return await this._getPlaylist(playlistId);
  }

  public async newPlaylist(guildId: string, name: string) {
    return this._newPlaylist(
      this.playlistRepository.create({
        guildId,
        name,
        ephemeral: false,
      }),
    );
  }

  public async newEphemeralPlaylist(guildId: string, name: string) {
    const p = this.playlistRepository.create({
      guildId,
      name,
    });
    p.ephemeral = true;
    return this._newPlaylist(p);
  }

  public async getNextTrack(previousTrack: string | TrackEntity, loop = false) {
    const prevTrack =
      typeof previousTrack == 'string'
        ? await this.getTrack(previousTrack)
        : previousTrack;

    const playlist = await this._getPlaylist(prevTrack.playlistId);
    if (!playlist) throw new Error('invalid playlist track');

    const indexTrack = playlist.tracksOrder.indexOf(prevTrack.id);
    let nextTrackId = playlist.tracksOrder[indexTrack + 1];
    if (!nextTrackId && !loop) throw new Error('not next track');
    else if (!nextTrackId && loop) nextTrackId = playlist.tracksOrder[0];

    return this._getTrack(nextTrackId);
  }

  public async addTrack(track: TrackEntity) {
    return await this._addTrack(track);
  }

  public async addTrackByURL(playlistId: string, url: string) {
    const musicInfo = await Youtube.getInfo(url);
    const track = this.trackRepository.create({
      playlistId: playlistId,
      duration: parseInt(musicInfo.duration, 10),
      url,
      isAvailable: true,
      title: musicInfo.title,
      thumbnails: musicInfo.thumbnails,
    });

    return await this._addTrack(track);
  }

  public async getTrack(trackId: string) {
    return this._getTrack(trackId);
  }

  public async getPlaylistAndTracks(playlistId: string) {
    const playlist = await this._getPlaylist(playlistId);
    if (!playlist) throw new Error('no playlist found');
    const tracks = await Promise.all(
      playlist.tracksOrder.map((trackId) => this._getTrack(trackId)),
    );

    return {
      playlist,
      tracks,
    };
  }

  public async newTrackFromUrl(url: string) {
    const musicInfo = await Youtube.getInfo(url);
    return this.trackRepository.create({
      duration: parseInt(musicInfo.duration, 10),
      url,
      isAvailable: true,
      title: musicInfo.title,
      thumbnails: musicInfo.thumbnails,
    });
  }

  public async getDirectUrl(track: TrackEntity): Promise<string> {
    const info = await Youtube.getInfo(track.url);
    return info.url;
  }

  public async getIndexOfTrackInPlaylist(trackId: string) {
    const track = await this._getTrack(trackId);
    if (!track) return -1;
    const playlist = await this._getPlaylist(track.playlistId);
    if (!playlist) return -1;
    return playlist.tracksOrder.indexOf(trackId);
  }

  public async isEphemeral(playlistId: string) {
    const playlist = await this._getPlaylist(playlistId);
    if (!playlist) throw new Error('no playlist found');
    return playlist.ephemeral;
  }
}
