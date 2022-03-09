import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { WorkerService } from '@/features/bot/worker/worker.service';
import { COMMANDS_BUILDER } from '@/features/bot/commands/cmd';
import { InjectRepository } from '@nestjs/typeorm';
import { PlaylistEntity } from '@/infra/entities/playlist.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CommandsService implements OnApplicationBootstrap {
  constructor(
    private readonly workerService: WorkerService,
    @InjectRepository(PlaylistEntity)
    private readonly playlistRepository: Repository<PlaylistEntity>,
  ) {}

  async onApplicationBootstrap() {
    const guilds = await this.workerService.getMainWorkerGuild();

    guilds.map(async (guild) => {
      const commandsManager = guild.commands;
      const commandMap = await commandsManager.fetch();

      void COMMANDS_BUILDER.map(async (commandBuilder) => {
        const command = commandMap.find(
          (command) => command.name == commandBuilder.name,
        );

        if (['add', 'play', 'list'].indexOf(commandBuilder.name) >= 0) {
          const playlists = await this.playlistRepository.find({
            guildId: guild.id,
          });

          const playlistChoice: [name: string, value: string][] = playlists
            .filter((playlist) => playlist.name)
            .map((playlist) => [playlist.name, playlist.id]);
          if (playlists.length > 0) {
            commandBuilder = commandBuilder.addStringOption((input) =>
              input
                .setName('playlist')
                .setDescription('list of playlist')
                .setChoices(playlistChoice)
                .setRequired(false),
            );
          }
        }
        if (!command) {
          await commandsManager.create(commandBuilder.toJSON());
        } else {
          await commandsManager.edit(command.id, commandBuilder.toJSON());
        }
      });
    });
  }
}
