import { BeforeInsert, Column, Entity, PrimaryColumn } from 'typeorm';
import { generateSnowFlakeId } from '@utils/snowflackid';

@Entity({
  name: 'channel',
})
export class VoiceChannelEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  guildId: string;

  @Column({ nullable: true })
  currentPlaylist?: string;

  @Column({ nullable: true })
  currentTrack?: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = generateSnowFlakeId();
  }
}
