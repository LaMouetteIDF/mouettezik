import { PlaylistEntity } from '@/infra/entities/playlist.entity';
import { Collection } from 'discord.js';
import { TrackEntity } from '@/infra/entities/track.entity';

export type ChannelState = {
  channelId: string;
  currentTrack?: string;
  playlist: PlaylistEntity;
  tracks: Collection<string, TrackEntity>;
};
