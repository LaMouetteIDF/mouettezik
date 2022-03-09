import { WorkerType } from './worker';
import { HexColorString } from 'discord.js';

export type NewWorkerOptions = {
  type: WorkerType;
  token: string;
};

export type WorkerInfo = {
  id: string;
  type: WorkerType;
  guilds: string[];
  user: {
    accentColor: number | null | undefined;
    avatar: string | null;
    banner: string | null | undefined;
    bot: boolean;
    createdAt: Date;
    createdTimestamp: number;
    defaultAvatarURL: string;
    discriminator: string;
    hexAccentColor: HexColorString | null | undefined;
    id: string;
    system: boolean;
    tag: string;
    username: string;
  };
};
