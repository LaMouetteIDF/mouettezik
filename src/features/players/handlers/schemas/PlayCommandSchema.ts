import { SlashCommandBuilder } from '@discordjs/builders';

export function newPlayCommandSchema() {
  const schema = new SlashCommandBuilder();
  schema.setName('play');
  schema.setDescription('Play music');
  schema.addStringOption((input) =>
    input
      .setName('url')
      .setDescription('Playlist or track URL')
      .setRequired(false),
  );
  return schema;
}

export const PlayCommandSchema = newPlayCommandSchema();
