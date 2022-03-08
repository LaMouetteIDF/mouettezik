import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkerEntity } from '@/infra/entities/worker.entity';
import { UserOAuth2 } from '@/infra/entities/userOAuth2.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkerEntity, UserOAuth2])],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
