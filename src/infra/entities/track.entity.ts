import { BeforeInsert, Column, Entity, PrimaryColumn } from 'typeorm';
import { generateSnowFlakeId } from '@utils/snowflackid';

type Thumbnail = {
  url: string;
  width: number;
  height: number;
};

function to(value: Thumbnail[]): string[] {
  return value.map((v) => [v.url, v.width, v.height].join(' '));
}

function from(value: string[]): Thumbnail[] {
  return value.map((v) => {
    const [url, width, height] = v.split(' ');
    return {
      url,
      width: parseInt(width, 10),
      height: parseInt(height, 10),
    };
  });
}

@Entity({
  name: 'track',
})
export class TrackEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  playlistId: string;

  @Column()
  title: string;

  @Column()
  url: string;

  @Column({
    type: 'simple-array',
    transformer: {
      to,
      from,
    },
  })
  thumbnails: Thumbnail[];

  @Column()
  duration: number; //Seconds

  @Column({ default: true })
  isAvailable: boolean;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = generateSnowFlakeId();
  }
}
