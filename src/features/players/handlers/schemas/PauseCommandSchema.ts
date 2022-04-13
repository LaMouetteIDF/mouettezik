import { SlashCommandBuilder } from '@discordjs/builders';

export function newPauseCommandSchema() {
  const schema = new SlashCommandBuilder();
  schema.setName('pause');
  schema.setDescription('Pause music');

  return schema;
}

export const PauseCommandSchema = newPauseCommandSchema();
