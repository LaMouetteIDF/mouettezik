import ytpl from 'ytpl';
import ytdl from 'ytdl-core';
import { Resource } from '../Resource';
import { IResourceBase } from '../../abstract/IResourceBase';
import { ITrackData } from 'core/entities/ITrackData';
import { IPlaylistData } from 'core/entities/IPlaylistData';
import { PlatformType } from '../../enums/PlatformType';

const YOUTUBE_BASE_URL = 'https://www.youtube.com';

const YOUTUBE_DOMAINS: readonly string[] = [
  'm.youtube.com',
  'music.youtube.com',
  'www.youtube.com',
  'youtube.com',
  'youtu.be',
];

const YOUTUBE_ALLOW_PATHS: readonly string[] = ['watch', 'playlist'];

export function isValidHostURL(url: URL | string): boolean {
  if (typeof url === 'string') {
    url = new URL(url);
  }
  return YOUTUBE_DOMAINS.includes(url.hostname);
}

export function cleanURL(url: string | URL): string {
  if (typeof url === 'string') {
    url = new URL(url);
  }
  if (!isValidURL(url)) return url.toString();
  const path = isPlaylist(url)
    ? `/playlist?list=${extractPlaylistId(url)}`
    : `/watch?v=${extractTrackId(url)}`;
  return new URL(path, YOUTUBE_BASE_URL).toString();
}

export function isValidURL(url: URL | string) {
  if (typeof url === 'string') {
    url = new URL(url);
  }
  try {
    if (!isValidHostURL(url)) return false;
    switch (url.hostname) {
      case 'youtu.be':
        return !!url.pathname.slice(1).split('/').shift();
      default:
        return YOUTUBE_ALLOW_PATHS.includes(
          url.pathname.slice(1).split('/').shift(),
        );
    }
  } catch {
    return false;
  }
}

export function isPlaylist(url: URL | string): boolean {
  if (typeof url === 'string') {
    url = new URL(url);
  }
  const path = url.pathname.slice(1).split('/').shift();
  return path === 'playlist';
}

export function extractTrackId(url: URL | string): string {
  if (typeof url === 'string') {
    url = new URL(url);
  }
  if (url.hostname === 'youtu.be') {
    return url.pathname.slice(1).split('/').shift();
  }
  return url.searchParams.get('v');
}

export function extractPlaylistId(url: URL | string): string {
  if (typeof url === 'string') {
    url = new URL(url);
  }
  return url.searchParams.get('list');
}

type ResourceData = ytpl.Result | ytdl.videoInfo;

export class YoutubeResource extends Resource<ResourceData> {
  static readonly platform = PlatformType.Youtube;
  readonly platform = YoutubeResource.platform;

  constructor(url: string) {
    super(cleanURL(url));
  }

  static isValidHost(url: string): boolean {
    return isValidHostURL(new URL(url));
  }

  static async stream(track: ITrackData) {
    return ytdl(track.url, { filter: 'audioonly', dlChunkSize: 0 });
  }

  isPlaylist() {
    if (!this._data) return false;
    return isPlaylist(this.url);
  }

  isTrack() {
    if (!this._data) return false;
    return !isPlaylist(this.url);
  }

  async fetch() {
    if (this._data) return this as unknown as IResourceBase<true>;
    await this.fetchData();
    return this as unknown as IResourceBase<true>;
  }

  getMetaData(): IPlaylistData | ITrackData | undefined {
    if (!this._data) return;

    return this.isPlaylist()
      ? this.dataToPlaylist(this._data as any)
      : this.dataToTrack(this._data as any);
  }

  private dataToPlaylist(data: ytpl.Result): IPlaylistData {
    if (!data) return;
    const tracks: ITrackData[] = data.items
      .filter((track) => !track.isLive)
      .sort((a, b) => (a.index > b.index ? 1 : a.index < b.index ? -1 : 0))
      .map((track) => ({
        id: track.id,
        platform: PlatformType.Youtube,
        thumbnail: track.bestThumbnail.url,
        title: track.title,
        url: track.shortUrl,
        duration: track.durationSec,
        isAvailable: true,
        isStream: false,
        uploader: {
          name: track.author.name,
          url: track.author.url,
        },
      }));

    return {
      id: data.id,
      title: data.title,
      platform: PlatformType.Youtube,
      url: data.url,
      tracks,
      isAvailable: true,
      uploader: {
        name: data.author?.name,
        url: data.author?.url,
      },
    };
  }

  private dataToTrack(data: ytdl.videoInfo): ITrackData {
    if (!data) return;

    return {
      id: data.videoDetails.videoId,
      platform: PlatformType.Youtube,
      title: data.videoDetails.title,
      url: data.videoDetails.video_url,
      duration: parseInt(data.videoDetails.lengthSeconds, 10) ?? 0,
      thumbnail: data.videoDetails.thumbnails.pop()?.url,
      uploader: {
        name: data.videoDetails.author.name,
        url: data.videoDetails.author.channel_url,
      },
      isStream: data.videoDetails.isLiveContent,
      isAvailable: true,
    };
  }

  private async fetchData(): Promise<ResourceData> {
    if (this._data) return this._data;

    if (!isValidURL(this.url)) throw new Error('invalid youtube url');

    if (isPlaylist(this.url)) {
      this._data = await ytpl(this.url, { limit: Infinity });
    } else {
      this._data = await ytdl.getBasicInfo(this.url);
    }

    return this._data;
  }
}
