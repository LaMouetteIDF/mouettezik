import { Message } from "discord.js";
import { ServerQueue } from "./server-queue";
export interface CommandRequest {
  cmd: string;
  func: (message: Message, serverQueue: ServerQueue) => void;
}

export interface Command {
  condition: (message: Message) => boolean;
  exec: (message: Message, serverQueue: ServerQueue) => void;
}

export type Song = {
  title: string;
  url: string;
};
