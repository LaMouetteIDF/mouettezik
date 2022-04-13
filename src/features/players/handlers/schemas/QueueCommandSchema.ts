import { SlashCommandBuilder } from '@discordjs/builders';

function queueCleanSubCommand(schema: SlashCommandBuilder) {
  schema.addSubcommand((subcommand) =>
    subcommand.setName('clean').setDescription('clean queue'),
  );
}

export function newQueueCommandSchema() {
  const schema = new SlashCommandBuilder();
  schema.setName('queue');
  schema.setDescription('show queue');

  queueCleanSubCommand(schema);

  return schema;
}

export const QueueCommandSchema = newQueueCommandSchema();
