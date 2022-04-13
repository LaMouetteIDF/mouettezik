import { SlashCommandBuilder } from '@discordjs/builders';

export function newPreviousCommandSchema() {
  const schema = new SlashCommandBuilder();
  schema.setName('previous');
  schema.setDescription('Previous track');

  return schema;
}

export const PreviousCommandSchema = newPreviousCommandSchema();
