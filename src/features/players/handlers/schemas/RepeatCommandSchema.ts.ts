import { SlashCommandBuilder } from '@discordjs/builders';

function RepeatModeOptions(schema: SlashCommandBuilder) {
  schema.addStringOption((input) =>
    input
      .setName('mode')
      .setDescription('Choice repeat mode : [all, one, none]. (default: none)')
      .setRequired(true)
      .setChoices([
        ['all', 'all'],
        ['one', 'one'],
        ['none', 'none'],
      ]),
  );
}

export function newRepeatCommandSchema() {
  const schema = new SlashCommandBuilder();
  schema.setName('repeat');
  schema.setDescription('Repeat mode');

  RepeatModeOptions(schema);

  return schema;
}

export const RepeatCommandSchema = newRepeatCommandSchema();
