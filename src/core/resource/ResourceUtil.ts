import { create as YouTubeDlCreate } from 'youtube-dl-exec';
import { PassThrough, Readable } from 'stream';

import { ITrackData } from 'core/entities/ITrackData';
import { IPlaylistData } from 'core/entities/IPlaylistData';
import { Uploader } from '../interfaces/Uploader';
import { PlatformType } from '../enums/PlatformType';

import { BaseResourcePlaylist, BaseResourceTrack } from './ResourceType';
import http, { ClientRequest, IncomingMessage } from 'http';
import https from 'https';
import WritableStream = NodeJS.WritableStream;

const YouTubeDl = YouTubeDlCreate('youtube-dl');

const YOUTUBE_DL_FORMAT =
  'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio/worstaudio/worst';

export async function getMetadata<T>(url: string): Promise<T> {
  return <T>(<unknown>await YouTubeDl(url, {
    dumpSingleJson: true,
  }));
}

export function dataToTrack(
  data: BaseResourceTrack,
  platform: PlatformType,
): ITrackData | undefined {
  if (!data || typeof data !== 'object') return;

  const {
    title,
    webpage_url: url,
    thumbnail,
    duration,
    uploader: author,
    uploader_url: author_url,
  } = data;

  let uploader: Uploader;
  if (uploader && author_url)
    uploader = {
      name: author,
      url: author_url,
    };

  return {
    id: undefined,
    platform,
    title,
    url,
    duration,
    isAvailable: true,
    thumbnail,
    isStream: false,
    uploader,
  };
}

export function dataToPlaylist(
  data: BaseResourcePlaylist,
  platform: PlatformType,
): IPlaylistData | undefined {
  if (typeof data !== 'object' || data._type !== 'playlist') return;

  const {
    title,
    webpage_url: url,
    entries,
    uploader: author,
    uploader_url: author_url,
  } = data;

  let uploader: Uploader;
  if (author && author_url)
    uploader = {
      name: author,
      url: author_url,
    };

  const tracks = entries
    .sort((a, b) =>
      a.playlist_index > b.playlist_index
        ? 1
        : a.playlist_index < b.playlist_index
        ? -1
        : 0,
    )
    .map((track) => dataToTrack(track, platform));

  return {
    id: undefined,
    title,
    platform,
    url,
    tracks,
    uploader,
    isAvailable: true,
  };
}

export async function getFormatURL(url: string): Promise<string> {
  const { stdout } = await YouTubeDl.exec(url, {
    getUrl: true,
    format: YOUTUBE_DL_FORMAT,
  });

  const formatURL = stdout.trim();
  if (!formatURL) throw new Error('format url not found');

  try {
    const url = new URL(formatURL);
    return url.toString();
  } catch {
    throw new Error('video format is not url');
  }
}

function pipeStream(url: string, dest: WritableStream) {
  let req: ClientRequest;

  const pipe = (data) => {
    data.pipe(dest);
  };

  switch (new URL(url).protocol) {
    case 'https:':
      req = https.get(url);
  }
}

const pipe = (stream: PassThrough) => (data: IncomingMessage) => {
  if (data.statusMessage === 'OK') data.pipe(stream);
  else stream.destroy(new Error(data.statusMessage ?? 'internal Error'));
};

export async function getStream(url: string): Promise<string | Readable> {
  const target = await getFormatURL(url);
  const stream = new PassThrough();
  let req: ClientRequest;

  stream.once('close', () => {
    if (!req.destroyed) req.destroy();
  });

  switch (new URL(target).protocol) {
    case 'https:':
      req = https.get(target, pipe(stream));
      break;
    case 'http:':
      req = http.get(target, pipe(stream));
      break;
    default:
      throw new Error('invalid url protocol');
  }

  req.once('error', (e) => {
    stream.destroy(new Error(e?.message ?? 'internal Error'));
  });

  return stream;
}
