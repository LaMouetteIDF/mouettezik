import { SlashCommandBuilder } from '@discordjs/builders';

export function newNextCommandSchema() {
  const schema = new SlashCommandBuilder();
  schema.setName('next');
  schema.setDescription('Next track');

  return schema;
}

export const NextCommandSchema = newNextCommandSchema();
