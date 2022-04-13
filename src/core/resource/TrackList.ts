import { Track } from './Track';
import { ITrackData } from 'core/entities/ITrackData';

export class TrackList extends Array<Track> {
  constructor(...tracks: ITrackData[] | Track[]) {
    super();

    for (const track of tracks) {
      if (track instanceof Track) this.push(track);
      else this.push(Track.from(track));
    }

    this._index = 0;
  }

  private _index: number;

  public get index(): number {
    if (!this.length) return 0;
    return this._index >= 0 ? this._index : 0;
  }

  public set index(index) {
    if (typeof index !== 'number' || isNaN(index)) return;

    if (index < 0) index = 0;

    this._index = index;
  }

  public get size(): number {
    return this.length;
  }

  public get current(): Track | undefined {
    if (!this.length) return;
    return this.get(this.index);
  }

  public get end(): boolean {
    if (!this.length) return true;
    return this.index >= this.size;
  }

  public get first(): Track | undefined {
    if (!this.length) return;
    return this.get(0);
  }

  public get last(): Track | undefined {
    if (!this.length) return;
    return this.get(this.size - 1);
  }

  public get next(): Track | undefined {
    return this.get(++this.index);
  }

  public get loop(): Track | undefined {
    const track = this.get(++this.index);
    return track ?? this.reset();
  }

  public get previous() {
    if (this.index == 0) this.index = this.size;
    return this.get(--this.index);
  }

  public get(index: number): Track | undefined {
    if (typeof index !== 'number' || isNaN(index) || index < 0)
      return undefined;

    return this.at(index);
  }

  public add(input: Track) {
    if (this.index === 0) this.push(input);
    else {
      this.splice(this.index, 0, input);
      ++this.index;
    }
    return this;
  }

  // add track after current and set index on him
  public addReplace(input: Track) {
    this.splice(++this.index, 0, input);
    return this;
  }

  public del(index: number): Track | undefined {
    if (index < 0) return;
    const val = this.splice(index - 1, 1);
    if (val.length == 0) return undefined;
    if (index < this.index) --this.index;
    return val.shift();
  }

  public setOrder(input: Array<Track>): this {
    if (this.length !== input.length)
      throw new Error('cant add or remove element on setOrder');
    const allInCurrent = input.every((v) => this.includes(v));
    if (!allInCurrent) throw new Error('cant replace element on setOrder list');
    const currValue = this.get(this._index);
    this.splice(0, this.length, ...input);
    if (currValue) this._index = this.findIndex((v) => v == currValue);
    return this;
  }

  public reset(): Track | undefined {
    this._index = 0;
    return this.get(0);
  }
}
