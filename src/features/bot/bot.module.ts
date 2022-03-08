import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CoreService } from './core/core.service';
import { VoiceService } from './voice/voice.service';
import { PlayerService } from './player/player.service';
import { WorkerService } from './worker/worker.service';
import { MessagesService } from './messages/messages.service';

import { UserOAuth2 } from '@/infra/entities/userOAuth2.entity';
import { WorkerEntity } from '@/infra/entities/worker.entity';
import { CommandsService } from './commands/commands.service';
import { PlaylistService } from './playlist/playlist.service';
import { PlaylistEntity } from '@/infra/entities/playlist.entity';
import { TrackEntity } from '@/infra/entities/track.entity';
import { VoiceChannelEntity } from '@/infra/entities/voiceChannel.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkerEntity,
      UserOAuth2,
      PlaylistEntity,
      TrackEntity,
      VoiceChannelEntity,
    ]),
  ],
  providers: [
    WorkerService,
    CoreService,
    VoiceService,
    PlayerService,
    MessagesService,
    CommandsService,
    PlaylistService,
  ],
})
export class BotModule {}
