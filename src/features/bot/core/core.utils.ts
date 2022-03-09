import { CommandInteraction } from 'discord.js';

import {
  AddPlayerOptions,
  ListPlayerOptions,
  PausePlayerOptions,
  PlayPlayerOptions,
  StopPlayerOptions,
} from '../player/player.types';

export function CmdToPlayPlayerOptions(
  interaction: CommandInteraction,
): PlayPlayerOptions {
  return {
    guildId: interaction.guildId,
    userId: interaction.user.id,
    options: {
      youtubeURL: interaction.options.getString('youtube_url', false),
      youtubeTitle: interaction.options.getString('youtube_title', false),
      playlist: interaction.options.getString('playlist', false),
      track: interaction.options.getNumber('track', false),
    },
    ctx: {
      interaction,
    },
  };
}

export function CmdToPausePlayerOptions(
  interaction: CommandInteraction,
): PausePlayerOptions {
  return {
    guildId: interaction.guildId,
    userId: interaction.user.id,
    ctx: {
      interaction,
    },
  };
}

export function CmdToAddPlayerOptions(
  interaction: CommandInteraction,
): AddPlayerOptions {
  return {
    guildId: interaction.guildId,
    userId: interaction.user.id,
    options: {
      youtubeURL: interaction.options.getString('youtube_url', true),
      playlist: interaction.options.getString('playlist', false),
    },
    ctx: {
      interaction,
    },
  };
}

export function CmdToListPlayerOptions(
  interaction: CommandInteraction,
): ListPlayerOptions {
  return {
    guildId: interaction.guildId,
    userId: interaction.user.id,
    options: {
      playlist: interaction.options.getString('playlist', false),
    },
    ctx: {
      interaction,
    },
  };
}

export function CmdToStopPlayerOptions(
  interaction: CommandInteraction,
): StopPlayerOptions {
  return {
    guildId: interaction.guildId,
    userId: interaction.user.id,
    ctx: {
      interaction,
    },
  };
}
