import { BeforeInsert, Column, Entity, PrimaryColumn } from 'typeorm';
import { generateSnowFlakeId } from '@utils/snowflackid';

export enum UserOAuth2Type {
  Identify = 'identify',
  Voice = 'voice',
}

@Entity({
  name: 'user-oauth2',
})
export class UserOAuth2 {
  @PrimaryColumn()
  id: string;

  @Column()
  userId: string;

  @Column({ default: UserOAuth2Type.Identify })
  type: UserOAuth2Type;

  @Column()
  accessToken: string;

  @Column({
    type: 'datetime',
    default: () => 'current_timestamp',
  })
  createdAt: Date;

  @Column()
  expiresIn: number;

  @Column()
  refreshToken: string;

  @Column('simple-array')
  scope: string[];

  @Column()
  tokenType: 'Bot' | 'Bearer';

  @Column({ default: true })
  isActive: boolean;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = generateSnowFlakeId();
  }
}
