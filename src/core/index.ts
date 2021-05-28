import { Client, Message } from "discord.js";
import {
  KillCMD,
  NextCMD,
  PauseCMD,
  PlayCMD,
  PrevCMD,
  StopCMD,
  RepeatCMD,
  VolumeCMD,
  HelpCMD,
  ListCMD,
  CleanCMD,
} from "../commands";
import { ServerQueue } from "./server-queue";
import { Command, CMDQueue } from "./type";

export const Queue = new Map<string, ServerQueue>();

export class MusicBot {
  private client: Client;

  private queue = Queue;

  private prefix = "!";
  private commandList: Array<CMDQueue> = [];

  constructor() {
    this.client = new Client();
    this.client.once("ready", () => {
      console.log("Ready!");
    });

    this.client.once("reconnecting", () => {
      console.log("Reconnecting!");
    });

    this.client.once("disconnect", () => {
      console.log("Disconnect!");
    });

    this.client.on("message", async (message: Message) => {
      if (message.author.bot) return;
      if (!message.content.startsWith(this.prefix)) return;

      let guildID = message.guild?.id;
      if (!guildID)
        return message.channel.send(
          "je suis au chiote là me fait pas chier !!"
        );
      let serverQueue = this.queue.get(guildID);

      if (!serverQueue) {
        serverQueue = new ServerQueue(message);
        this.queue.set(guildID, serverQueue);
      }

      let isOK = false;

      this.commandList.forEach((item) => {
        if (item.condition(message)) {
          if (!serverQueue)
            return message.channel.send(
              "je suis au chiote là me fait pas chier !!"
            );
          isOK = true;
          item.cmd.func(message, serverQueue);
        }
      });

      if (!isOK) message.channel.send("Commande inconnu");
    });
    this.getDefaultCommands().forEach((item) => this.addCommand(item));
  }

  setPrefix(prefix: string) {
    this.prefix = prefix;
  }

  addCommand(cmd: Command) {
    const command: CMDQueue = {
      condition: (message: Message) =>
        message.content.split(" ")[0] === `${this.prefix}${cmd.startWith}`,
      cmd,
    };
    this.commandList.push(command);
  }

  getDefaultCommands(): Array<Command> {
    return [
      { startWith: "help", func: HelpCMD },
      { startWith: "play", func: PlayCMD },
      { startWith: "pause", func: PauseCMD },
      { startWith: "stop", func: StopCMD },
      { startWith: "next", func: NextCMD },
      { startWith: "prev", func: PrevCMD },
      { startWith: "kill", func: KillCMD },
      { startWith: "vol", func: VolumeCMD },
      { startWith: "repeat", func: RepeatCMD },
      { startWith: "list", func: ListCMD },
      { startWith: "clean", func: CleanCMD },
    ];
  }

  connect(token: string) {
    this.client.login(token);
  }
}

export default MusicBot;
