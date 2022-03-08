import { SlashCommandBuilder } from '@discordjs/builders';

export function newPauseCommandSchema() {
  return new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause music');
}

export const PAUSE_COMMAND = newPauseCommandSchema();
