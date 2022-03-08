import { PLAY_COMMAND } from '@/features/bot/commands/cmd/play';
import { PAUSE_COMMAND } from '@/features/bot/commands/cmd/pause';
import { LIST_COMMAND } from '@/features/bot/commands/cmd/list';
import { STOP_COMMAND } from '@/features/bot/commands/cmd/stop';
import { ADD_COMMAND } from '@/features/bot/commands/cmd/add';

export * from './play';
export * from './pause';
export * from './stop';
export * from './list';

export const COMMANDS_BUILDER = [
  PLAY_COMMAND,
  PAUSE_COMMAND,
  LIST_COMMAND,
  STOP_COMMAND,
  ADD_COMMAND,
];
