import { BeforeInsert, Column, Entity, PrimaryColumn } from 'typeorm';
import { WorkerType } from '@/features/bot/worker/worker';
import { generateSnowFlakeId } from '@utils/snowflackid';

@Entity({
  name: 'worker',
})
export class WorkerEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  accessToken: string;

  @Column()
  type: WorkerType;

  @Column({ default: true })
  isActive: boolean;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = generateSnowFlakeId();
  }
}
