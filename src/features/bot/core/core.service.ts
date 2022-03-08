import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommandInteraction, Interaction, VoiceState } from 'discord.js';
import { Repository } from 'typeorm';

import { WorkerService } from '@/features/bot/worker/worker.service';
import { Worker, WorkerType } from '@/features/bot/worker/worker';
import { PlayerService } from '@/features/bot/player/player.service';
import { VoiceService } from '@/features/bot/voice/voice.service';
import { WorkerEntity } from '@/infra/entities/worker.entity';
import { UserOAuth2 } from '@/infra/entities/userOAuth2.entity';

import {
  CmdToAddPlayerOptions,
  CmdToPausePlayerOptions,
  CmdToPlayPlayerOptions,
  CmdToStopPlayerOptions,
} from '@/features/bot/core/core.utils';

@Injectable()
export class CoreService implements OnModuleInit {
  constructor(
    @InjectRepository(WorkerEntity)
    private readonly workersRepository: Repository<WorkerEntity>,
    @InjectRepository(UserOAuth2)
    private readonly userOAuth2Repository: Repository<UserOAuth2>,
    private readonly workerService: WorkerService,
    private readonly playerService: PlayerService,
    private readonly voiceService: VoiceService,
  ) {}

  async onModuleInit() {
    const workersDB = await this.workersRepository.find();

    const workers = await Promise.all(
      workersDB.map(async ({ type, accessToken: token }) =>
        (await this.workerService.add({ type, token })).pop(),
      ),
    );

    const mainWorker = workers.find(
      (worker) => worker.type === WorkerType.Main,
    );
    if (mainWorker) await this.addListeners(mainWorker);
  }

  private addListeners(worker: Worker) {
    const client = worker.getWorkerClient();

    client
      .on('interactionCreate', this.onInteractionCreate.bind(this))
      .on('voiceStateUpdate', this._voiceStateUpdate.bind(this));
  }

  private async onInteractionCreate(interaction: Interaction) {
    if (interaction.inGuild() && interaction.isCommand()) {
      await this.runCommandInteraction(interaction);
    }
  }

  private async runCommandInteraction(
    commandInteraction: CommandInteraction<'present'>,
  ) {
    switch (commandInteraction.commandName) {
      case 'play':
        await this.playerService.play(
          CmdToPlayPlayerOptions(commandInteraction),
        );
        break;
      case 'pause':
        await this.playerService.pause(
          CmdToPausePlayerOptions(commandInteraction),
        );
        break;
      case 'add':
        await this.playerService.add(CmdToAddPlayerOptions(commandInteraction));
        break;
      case 'stop':
        await this.playerService.stop(
          CmdToStopPlayerOptions(commandInteraction),
        );
        break;
    }
  }

  private async _voiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
    await this.voiceService.onGuildVoiceStateUpdate(
      oldState.guild.id,
      oldState.channelId ?? newState.channelId,
    );
  }
}
