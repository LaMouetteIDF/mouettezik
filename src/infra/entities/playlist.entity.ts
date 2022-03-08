import { BeforeInsert, Column, Entity, PrimaryColumn } from 'typeorm';
import { generateSnowFlakeId } from '@utils/snowflackid';

@Entity({
  name: 'playlist',
})
export class PlaylistEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  guildId: string;

  @Column()
  name: string;

  @Column('simple-array')
  tracksOrder: string[];

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = generateSnowFlakeId();
  }

  ephemeral = false;
}
