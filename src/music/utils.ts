import ytdl from "ytdl-core";
import ytpl from "ytpl";
import { Song } from "../core/type";

export function isYTURL(url: string) {
  let regx = /^(http[s]+:\/\/)(www\.)+youtube\.[\w]{2,3}\/(watch|playlist)/;
  return regx.test(url);
}

export function isYTPlaylist(url: string) {
  const regx = /playlist/;
  return regx.test(url);
}

export async function getSongsInYTPlaylist(url: string) {
  let songs: Array<Song> = [];
  let u = new URL(url);
  let PlaylistID = u.searchParams.get("list");
  if (!PlaylistID) return songs;
  const playlist = await ytpl(PlaylistID);
  playlist.items.forEach((item) => {
    songs.push({
      title: item.title,
      url: item.url,
    });
  });
  return songs;
}

export async function getSongYT(url: string) {
  const songInfo = await ytdl.getInfo(url);

  return {
    title: songInfo.videoDetails.title,
    url: songInfo.videoDetails.video_url,
  };
}

export async function getInfoYTPlaylist(url: string) {
  let u = new URL(url);
  let playlistID = u.searchParams.get("list");
  if (!playlistID) return "";
  const playlist = await ytpl(playlistID);
  return playlist.title;
}
