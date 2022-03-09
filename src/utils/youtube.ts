import * as YT from 'ytdl-core';
import { log } from 'util';

export interface YTParseURL {
  url: string;
  id: string;
  t: number;
}

export type YoutubeURL = string;

const REGEXP_YOUTUBE_URL =
  /^https?:\/\/(?:www\.youtube\.com\/|m\.youtube\.com\/|music\.youtube\.com\/|youtube\.com\/)?(?:\?vi?=|youtu\.be\/|vi?\/|user\/.+\/u\/\w{1,2}\/|embed\/|playlist\?(?:.&)?list=|watch\?(?:.*&)?vi?=|&vi?=|\?(?:.*&)?vi?=)([^#&?\n\/<>"']*)(?:[?&]?list=(?:[^#&?\n\/<>"']*)?)?(?:[?&]index=(?:\d+)?)?(?:[?&]t=)?(\d+)?$/i;

export default class Youtube {
  private static _parseURL(url: string) {
    const match = url.match(REGEXP_YOUTUBE_URL);

    if (!Array.isArray(match)) throw new Error('invalid url');

    return match;
  }

  public static isValid(url: string): url is YoutubeURL {
    return YT.validateURL(url);
  }

  public static parseURL(url: YoutubeURL): YTParseURL {
    const match = Youtube._parseURL(url);

    let time = parseInt(match[2], 10);
    if (isNaN(time)) time = 0;

    return {
      url,
      id: match[1],
      t: time,
    };
  }

  public static async getInfo(url: YoutubeURL) {
    const info = await YT.getInfo(url);
    const format = Youtube._getAudioFormat(info);
    console.log(format);
    return {
      id: info.videoDetails.videoId,
      title: info.videoDetails.title,
      duration: info.videoDetails.lengthSeconds,
      thumbnails: info.videoDetails.thumbnails,
      url: format.url,
    };
  }

  public static async getAudioStream(url: YoutubeURL) {
    const info = await YT.getInfo(url);

    return YT.downloadFromInfo(info, {
      format: Youtube._getAudioFormat(info),
    });
  }

  private static _getAudioFormat(info: YT.videoInfo) {
    const audioFormats = YT.filterFormats(info.formats, 'audioonly');

    let formats = audioFormats.filter(
      (item) =>
        item.audioCodec == 'opus' && item.audioQuality?.includes('MEDIUM'),
    );

    if (formats.length == 0)
      formats = audioFormats.filter((item) => item.audioCodec == 'opus');

    if (audioFormats.length == 0 && formats.length == 0)
      throw new Error('This video have not opus audio format.');

    return formats[0] ?? audioFormats[0];
  }
}
