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
  new(
    guildID: string,
    textChannel: TextChannel,
    logsChannel: TextChannel = null,
  ) {
    console.log('toto');

    const queue: PlayerState = {
      textChannelID: textChannel.id,
      textChannel,
      logsChannel: logsChannel,
      logsChannelID: logsChannel?.id ?? null,
      voiceChannelID: null,
      voiceConnection: null,
      volume: 0,
      currentPlayingTime: 0,
      playing: false,
    };
    (queue.timer = (function () {
      let timer: any;
      function newTimer(this: PlayerState) {
        timer = setInterval(() => {
          this.currentPlayingTime++;
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
