import { SlashCommandBuilder } from '@discordjs/builders';

export function newPlayCommandSchema() {
  return new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play music')
    .addStringOption((input) =>
      input
        .setName('youtube_url')
        .setDescription('Youtube video URL')
        .setRequired(false),
    )
    .addNumberOption((input) =>
      input.setName('track').setDescription('track number').setRequired(false),
    );
}

export const PLAY_COMMAND = newPlayCommandSchema();
