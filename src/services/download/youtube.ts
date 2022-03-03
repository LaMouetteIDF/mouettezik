import {
  validateID,
  getInfo,
  filterFormats,
  downloadFromInfo,
} from 'ytdl-core';

import * as ytpl from 'ytpl';
import * as execa from 'execa';
import { PassThrough } from 'stream';

export interface ParseResult {
  url: string;
  id: string;
  t: number;
}
const regExp =
  /^https?\:\/\/(?:www\.youtube\.com\/|m\.youtube\.com\/|music\.youtube\.com\/|youtube\.com\/)?(?:\?vi?=|youtu\.be\/|vi?\/|user\/.+\/u\/\w{1,2}\/|embed\/|playlist\?(?:.\&)?list=|watch\?(?:.*\&)?vi?=|\&vi?=|\?(?:.*\&)?vi?=)([^#\&\?\n\/<>"']*)(?:(?:\?|\&)?list=(?:[^#\&\?\n\/<>"']*)?)?(?:[\?\&]index=(?:\d+)?)?(?:[\?\&]t=)?(\d+)?$/i;

export class Youtube {
  validateID = validateID;

  validateURL(url: string) {
    const p = this.parseURL(url);
    if (!p) return false;

    if (ytpl.validateID(p.id) || this.validateID(p.id)) return true;

    return false;
  }

  parseURL(url: string): ParseResult | null {
    const match = url.match(regExp);

    if (Array.isArray(match)) {
      const url = match[0];
      const id = match[1];

      const result: ParseResult = {
        url,
        id,
        t: 0,
      };

      const time = parseInt(match[2], 10);
      if (!isNaN(time)) result.t = time;

      return result;
    }
    return null;
  }

  async getInfo(url: string): Promise<Tracks> {
    if (!this.validateURL(url)) throw new Error('This is not youtube URL');
    const p = this.parseURL(url);

    const tracks: Tracks = [];

    if (ytpl.validateID(p.id)) {
      const info = await ytpl(p.id);

      info.items.forEach((item) => {
        let thumbnail = '';
        if (item.thumbnails.length > 0) {
          const thumbnails = item.thumbnails.filter(
            (t) => t.height == 336 && t.width == 188,
          );
          if (thumbnails.length == 0) thumbnail = item.thumbnails[0].url;
        }

        tracks.push({
          title: item.title,
          url: item.shortUrl,
          live: item.isLive,
          startTime: p.t,
          thumbnail,
        });
      });
    } else if (this.validateID(p.id)) {
      let item = await getInfo(p.id);
      let thumbnail: string;
      if (item.videoDetails.thumbnails.length > 0) {
        const thumbnails = item.videoDetails.thumbnails.filter(
          (t) => t.height == 336 && t.width == 188,
        );
        if (thumbnails.length == 0)
          thumbnail = item.videoDetails.thumbnails[0].url;
      }

      tracks.push({
        title: item.videoDetails.title,
        url: item.videoDetails.video_url,
        live: item.videoDetails.isLiveContent,
        startTime: p.t,
        thumbnail,
      });
    } else
      throw new Error(
        `This is not youtube valid playlist or watch ID "${p.id}"`,
      );

    return tracks;
  }

  async getAudioStream(url: string) {
    try {
      const info = await getInfo(url);
      // console.log(info);

      let audioFormats = filterFormats(info.formats, 'audioonly');
      if (audioFormats.length <= 0)
        throw new Error('This video have not audio format.');
      let formats = audioFormats.filter(
        (item) =>
          item.audioCodec == 'opus' && item.audioQuality.includes('MEDIUM'),
      );
      if (formats.length == 0)
        formats = audioFormats.filter((item) => item.audioCodec == 'opus');
      return downloadFromInfo(info, {
        format: formats[0] ?? audioFormats[0],
      });
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}