import { TextChannel } from 'discord.js';
import { text } from 'express';
import { PlayerState, PlayerQueue } from './type';

export class CollectionQueue extends Map<string, PlayerQueue> {
  new(guildID: string) {
    const queue: PlayerQueue = {
      potition: 0,
      tracks: [],
    };
    this.set(guildID, queue);
    return queue;
  }
}

export class CollectionState extends Map<string, PlayerState> {
  new(guildID: string, textChannel: TextChannel, logsChannel?: TextChannel) {
    const queue: PlayerState = {
      textChannel,
      logsChannel: logsChannel ?? textChannel,
      volume: 0,
      curPosPlayingTime: 0,
      playing: false,
    };
    (queue.timer = (function () {
      let timer: any;
      function newTimer(this: PlayerState) {
        timer = setInterval(() => {
          this.curPosPlayingTime++;
        }, 1000);
      }
      function clearTimer(this: PlayerState) {
        clearInterval(timer);
      }
      return {
        newTimer: newTimer.bind(queue),
        clearTimer: clearTimer.bind(queue),
      };
    })()),
      this.set(guildID, queue);
    return queue;
  }
}
