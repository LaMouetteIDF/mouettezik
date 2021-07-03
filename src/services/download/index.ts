import * as execa from 'execa';
import * as ffmpeg from 'fluent-ffmpeg';
import { PassThrough, Readable } from 'stream';
import got from 'got';

import { Youtube } from './youtube';

export class Downloads {
  protected _yt: Youtube;

  constructor() {
    this._yt = new Youtube();
  }

  async getInfo(url: string) {
    if (this._yt.validateURL(url)) {
      const info = await this._yt.getInfo(url);
      const items = info.map(async (item) => {
        if (item.live) {
          const directURLs = (await getDirectURL(item.url)).split(/\r?\n/);
          item.directURL = directURLs[0];
        }
        return item;
      });
      return Promise.all(items);
    }

    const tracks: Tracks = [];

    const titles = (await getTitle(url)).split(/\r?\n/);
    const directURLs = (await getDirectURL(url)).split(/\r?\n/);
    const thumbnails = (await getThumbnail(url)).split(/\r?\n/);

    let gapDirectURL = directURLs.length / titles.length;

    for (let i = 0; i < titles.length; i++) {
      const porDirectURL = (i + 1) * gapDirectURL - 1;

      const track: Track = {
        url,
        title: titles[i],
        live: directURLs[porDirectURL].match(/\.(m3u|m3u8)/) ? true : false,
        directURL: directURLs[porDirectURL],
        startTime: 0,
        thumbnail: thumbnails[i],
      };

      tracks.push(track);
    }

    return tracks;
  }

  // private getstreamFromURL(url: string) {
  //   try {
  //     const stream = new PassThrough();

  //     const res = got.stream(url)
  //     res.on('')
  //   } catch (e) {
  //     console.log(e);
  //     throw e

  //   }
  // }

  async getAudioStream(
    track: Track,
  ): Promise<Readable | { stream: PassThrough; kill: Function }> {
    if (
      this._yt.validateURL(track.url) &&
      track.startTime == 0 &&
      !track.live
    ) {
      return this._yt.getAudioStream(track.url);
    }

    let source: string | Readable = track.directURL;

    if (this._yt.validateURL(track.url) && !track.live) {
      source = await this._yt.getAudioStream(track.url);
    }

    const command = ffmpeg({ source });

    command
      .setStartTime(track.startTime)
      .withAudioCodec('libmp3lame')
      .audioFrequency(48000)
      .audioChannels(2)
      .format('mp3')
      .on('error', function (e) {
        if (e) console.log(e);
        console.log('Ffmpeg has been killed');
      });

    const stream = command.pipe();

    const kill = () => {
      command.kill('SIGKILL');
    };

    // console.log('toto');
    if (stream instanceof PassThrough) return { stream, kill };
  }
}

async function getAllInfo(url: string) {
  const proc = await execa('youtube-dl', ['-g -e --get-thumbnail', url]);
  return proc.stdout.trim();
}

async function getDirectURL(url: string) {
  const proc = await execa('youtube-dl', ['-g', url]);
  return proc.stdout.trim();
}

async function getTitle(url: string) {
  const proc = await execa('youtube-dl', ['-e', url]);
  return proc.stdout.trim();
}

async function getThumbnail(url: string) {
  const proc = await execa('youtube-dl', ['--get-thumbnail', url]);
  return proc.stdout.trim();
}
