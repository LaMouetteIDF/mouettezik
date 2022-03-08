import { GuildCollection } from '@/features/bot/voice/voice.types';

export function getVoiceWorkerByChannel(
  guild: GuildCollection,
  channelId: string,
) {
  return guild.find((voiceWorker) => voiceWorker.channelId === channelId);
}
