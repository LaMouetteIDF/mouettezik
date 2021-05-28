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

type Song = {
  title: string;
  url: string;
};

export class Music {
  private _playing = false;
  private _stoping = false;
  private _volume = 5;

  voiceChannel: VoiceChannel;
  connection: VoiceConnection;
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
    if (this.connection && this.connection.status == 0 && this._playing) {
      return true;
    }
    return false;
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

  private get isVoiceConneted() {
    if (!this.connection) return false;
    if (this.connection.status == 4) return false;
    return true;
  }

  constructor(
    voiceChannel: VoiceChannel,
    textChannel: TextChannel | DMChannel | NewsChannel
  ) {
    this.voiceChannel = voiceChannel;
    this.textChannel = textChannel;
  }

  private async voiceConnect() {
    this.connection = await this.voiceChannel.join();
  }

  async add(url: string) {
    if (!isYTURL(url)) return false;
    if (isYTPlaylist(url)) {
      const songs = await getSongsInYTPlaylist(url);
      songs.forEach((item) => {
        this.playlist.songs.push(item);
      });
    } else {
      this.playlist.songs.push(await getSongYT(url));
    }
    return true;
  }

  async play(track = 0) {
    let song = this.playlist.songs[track];

    if (!song) {
      this.stop();
      return false;
    }
    if (!this.isVoiceConneted) {
      await this.voiceConnect();
    }

    this.playlist.track = track;

    this.dispatcher = this.connection.play(ytdl(song.url));
    this.dispatcher.on("start", () => {
      this._playing = true;
      this._stoping = false;
    });

    this.dispatcher.on("finish", () => {
      if (this._playing) {
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

    this.dispatcher.on("error", (error) => {
      console.error(error);
      this.textChannel.send(
        "**Erreur:** Une erreur c'est produite lors de la lecture"
      );
      this.stop();
    });
    this.dispatcher.setVolume(this.volume / 100);
    this.textChannel.send(`Lecture: **${song.title}**`);
    return true;
  }

  pause() {
    if (this._playing && this.dispatcher) {
      this.dispatcher.pause();
      this._playing = false;
      this._stoping = false;
      this.textChannel.send("Mise en pause de la lecture");
    }
  }

  resume() {
    if (this.dispatcher) {
      this.dispatcher.resume();
      this._playing = true;
      this._stoping = false;
      this.textChannel.send("Reprise le la lecture");
    }
  }

  stop() {
    if (this._playing && this.dispatcher) {
      this.dispatcher.end();
      this._playing = false;
      this._stoping = true;
      this.dispatcher = undefined;
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
    this.playlist.track = 0;
    this.playlist.songs = [];
  }

  kill() {
    this.stop();
    this.clean();
    this.voiceChannel.leave();
  }
}
