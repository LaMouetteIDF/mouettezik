import { Message } from 'discord.js';
import { ServerQueue } from './server-queue';
export interface Command {
  startWith: string;
  func: (message: Message, serverQueue: ServerQueue) => void;
}

export interface CMDQueue {
  condition: (message: Message) => boolean;
  cmd: Command;
}

export type Song = {
  title: string;
  url: string;
};
