import { SlashCommandBuilder } from '@discordjs/builders';

export function newAddCommandSchema() {
  return new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add music in playlist | default is current')
    .addStringOption((input) =>
      input
        .setName('youtube_url')
        .setDescription('Youtube video URL')
        .setRequired(true),
    );
}

export const ADD_COMMAND = newAddCommandSchema();
