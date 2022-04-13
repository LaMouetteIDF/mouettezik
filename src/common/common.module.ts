import { Module, OnModuleInit } from '@nestjs/common';
import { DiscoveryModule, DiscoveryService } from '@nestjs/core';

import { InteractionRouter } from 'core/router/InteractionRouter';
import { HandleStore } from 'core/store/HandleStore';

import { CommonService } from './common.service';
import { CommandManager } from './managers/command.manager';
import { PlayerManager } from './managers/player.manager';
import { ViewManager } from './managers/view.manager';
import { VoicesManager } from './managers/voices.manager';
import { WorkersManager } from './managers/workers.manager';

@Module({
  imports: [DiscoveryModule],
  providers: [
    CommonService,
    WorkersManager,
    VoicesManager,
    PlayerManager,
    CommandManager,
    ViewManager,
  ],
  exports: [
    CommonService,
    WorkersManager,
    VoicesManager,
    PlayerManager,
    CommandManager,
    ViewManager,
  ],
})
export class CommonModule implements OnModuleInit {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly coreService: CommonService,
  ) {}

  onModuleInit() {
    const wrappers = [
      ...this.discoveryService.getControllers(),
      ...this.discoveryService.getProviders(),
    ];

    const router = new InteractionRouter(HandleStore.from(wrappers));

    this.coreService.client.on('interactionCreate', router.onInteractionCreate);
  }
}
