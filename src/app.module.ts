import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CommonModule } from 'common/common.module';
import { PlayersModule } from './features/players/players.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    PlayersModule,
  ],
})
export class AppModule {}
