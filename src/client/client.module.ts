import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientService } from './client.service';

@Module({
  imports: [ConfigModule],
  providers: [ClientService],
  exports: [ClientService],
})
export class ClientModule {}
