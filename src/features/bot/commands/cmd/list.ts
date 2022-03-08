import { SlashCommandBuilder } from '@discordjs/builders';

export function newListCommandSchema() {
  return new SlashCommandBuilder()
    .setName('list')
    .setDescription('Playlist view');
}

export const LIST_COMMAND = newListCommandSchema();
