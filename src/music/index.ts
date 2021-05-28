import Discord, {
  Message,
  TextChannel,
  DMChannel,
  NewsChannel,
  VoiceChannel,
  VoiceConnection,
  StreamDispatcher,
} from "discord.js";
import {
  getSongsInYTPlaylist,
  getSongYT,
  isYTPlaylist,
  isYTURL,
} from "./utils";

import ytdl from "ytdl-core";
import ytpl from "ytpl";

type Song = {
  title: string;
  url: string;
};

export class Music {
  private _playing = false;
  private _stoping = false;
  private _volume = 5;

  connection?: VoiceConnection;
  dispatcher?: StreamDispatcher;
  textChannel: TextChannel | DMChannel | NewsChannel;

  repeat = {
    state: false,
    value: "ALL" as "ONE" | "ALL",
  };

  playlist = {
    track: 0,
    songs: [] as Array<Song>,
  };

  get isPlaying() {
    return this._playing;
  }
  get isStoping() {
    return this._stoping;
  }

  get isPaused() {
    return this.dispatcher?.paused ?? false;
  }

  get volume() {
    return this._volume;
  }

  set volume(vol: number) {
    this._volume = vol;
    this.dispatcher?.setVolume(vol / 100);
  }

  constructor(message: Message) {
    this.textChannel = message.channel;
  }

  async add(url: string) {
    if (!isYTURL(url)) return;
    if (isYTPlaylist(url)) {
      const songs = await getSongsInYTPlaylist(url);
      songs.forEach((item) => {
        this.playlist.songs.push(item);
      });
    } else {
      this.playlist.songs.push(await getSongYT(url));
    }
  }

  play(track = 0) {
    let song = this.playlist.songs[track];
    console.log(song);

    if (!song) {
      this._playing = false;
      this._stoping = true;
      return;
    }
    if (!this.connection) return;
    this.dispatcher = this.connection.play(ytdl(song.url));
    this.dispatcher.on("start", () => {
      this._playing = true;
      this._stoping = false;
    });
    this.dispatcher.on("finish", () => {
      if (this._playing && !this._stoping) {
        if (this.repeat.state && this.repeat.value == "ONE")
          return this.play(this.playlist.track);
        this.playlist.track++;
        if (
          this.repeat.state &&
          this.repeat.value == "ALL" &&
          !this.playlist.songs[this.playlist.track]
        )
          this.playlist.track = 0;
        this.play(this.playlist.track);
      }
    });
    this.dispatcher.on("error", (error) => console.error(error));
    this.dispatcher.setVolume(this.volume / 100);
    this.textChannel.send(`Lecture: **${song.title}**`);
  }

  pause() {
    if (this._playing && this.dispatcher) {
      this.dispatcher.pause();
      this._playing = false;
      this._stoping = false;
    }
  }

  resume() {
    if (this.dispatcher) {
      this.dispatcher.resume();
      this._playing = true;
      this._stoping = false;
    }
  }

  stop() {
    if (this._playing && this.dispatcher) {
      this.dispatcher.end();
      this._playing = false;
      this._stoping = true;
    }
  }

  prev() {
    if (this.playlist.songs.length > 0) {
      let song = this.playlist.songs[--this.playlist.track];
      if (!song) this.playlist.track = 0;
      this.stop();
      this.play(this.playlist.track);
    }
  }

  next() {
    if (this.playlist.songs.length > 0) {
      let song = this.playlist.songs[++this.playlist.track];
      if (!song) this.playlist.track = 0;
      this.stop();
      this.play(this.playlist.track);
    }
  }

  list() {
    return this.playlist.songs.map((item) => item.title);
  }

  clean() {
    this.playlist.songs = [];
  }
}
