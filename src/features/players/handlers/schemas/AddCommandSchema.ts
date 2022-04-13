import { SlashCommandBuilder } from '@discordjs/builders';

export function newAddCommandSchema() {
  const schema = new SlashCommandBuilder();
  schema.setName('add');
  schema.setDescription('Add track in queue');
  schema.addStringOption((input) =>
    input.setName('url').setDescription('track URL').setRequired(true),
  );
  return schema;
}

export const AddCommandSchema = newAddCommandSchema();
