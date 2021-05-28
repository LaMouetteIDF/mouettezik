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
import { Command, CommandRequest } from "./type";

export class MusicBot {
  client: Client;

  private commandList: Array<Command> = [];
  private prefix = "!";

  private queue = new Map<string, ServerQueue>();

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
          item.exec(message, serverQueue);
        }
      });

      if (!isOK) message.channel.send("Commande inconnu");
    });
    this.getDefaultCommands().forEach((item) => this.addCommand(item));
  }

  setPrefix(prefix: string) {
    this.prefix = prefix;
  }

  addCommand(commandReq: CommandRequest) {
    const command: Command = {
      condition: (message: Message) =>
        message.content.startsWith(`${this.prefix}${commandReq.cmd}`),
      exec: commandReq.func,
    };
    this.commandList.push(command);
  }

  getDefaultCommands(): Array<CommandRequest> {
    return [
      { cmd: "help", func: HelpCMD },
      { cmd: "play", func: PlayCMD },
      { cmd: "pause", func: PauseCMD },
      { cmd: "stop", func: StopCMD },
      { cmd: "next", func: NextCMD },
      { cmd: "prev", func: PrevCMD },
      { cmd: "kill", func: KillCMD },
      { cmd: "vol", func: VolumeCMD },
      { cmd: "repeat", func: RepeatCMD },
      { cmd: "list", func: ListCMD },
      { cmd: "clean", func: CleanCMD },
    ];
  }

  connect(token: string) {
    this.client.login(token);
  }
}

export default MusicBot;
