import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandsService } from '@/commands/commands.service';
import { ClientService } from '@/client/client.service';
import { Message } from 'discord.js';
import { Queue, ServerQueue } from './server-queue';

@Injectable()
export class CoreService implements OnModuleInit {
  private readonly logger = new Logger(CoreService.name);

  constructor(
    private configService: ConfigService,
    private Commands: CommandsService,
    private client: ClientService,
  ) {}

  onModuleInit() {
    this.run();
  }

  run() {
    this.client.addEventListener('message', (message: Message) => {
      const prefix = this.configService.get('CMD_PREFIX');
      if (!message.content.startsWith(prefix) || message.author.bot) return;

      const args = message.content.slice(prefix.length).trim().split(/ +/);
      const command = args.shift().toLowerCase();

      if (this.Commands.isExistCommand(command)) {
        let guildID = message.guild?.id;
        if (!guildID)
          return message.channel.send(
            'je suis au chiote là me fait pas chier !!',
          );
        let serverQueue = Queue.get(guildID);

        if (!serverQueue) {
          serverQueue = new ServerQueue(message);
          Queue.set(guildID, serverQueue);
        }

        const exec = this.Commands.getExec(command);
        exec(message, serverQueue);
      }
    });
  }
}
