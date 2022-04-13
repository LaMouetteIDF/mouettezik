import { codeBlock } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import { EmbedOptions } from './embed.types';

const DEFAULT_THUMBNAIL =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Solid_black.svg/1024px-Solid_black.svg.png';

const PROGRESS_BAR_LENGTH = 25;

const NO_TIME = '-:--';

export function ProgressBar(value = 0, length = 40) {
  if (!length || length < 5) return '[]';
  if (!value) value = 0;
  if (value > 100) value = 100;
  length -= 2;
  const p = Math.floor((+value.toFixed() * length) / 100);

  const bar = [];

  for (let i = 0; i < length; i++) bar.push(i < p ? '|' : '_');
  return `[${bar.join('')}]`;
}

export enum TimeSize {
  sec,
  min,
  hour,
  day,
}

function fixTime(input = 0) {
  return input.toFixed(0).padStart(2, '0');
}

export function Time(time = 0, size = TimeSize.min) {
  if (!time || time < 0) time = 0;
  if (typeof time !== 'number') time = 0;
  switch (size) {
    case TimeSize.sec:
      return time.toString(10);
    case TimeSize.min:
      const min = Math.floor(time / 60);
      const sec = time - min * 60;
      return `${fixTime(min)}:${fixTime(sec)}`;
  }
}

function timeProgressBar(start?: number, end?: number) {
  return codeBlock(
    `${start || start >= 0 ? Time(start) : NO_TIME} ${ProgressBar(
      end && start >= 0 ? Math.floor((start / end) * 100) : 0,
      PROGRESS_BAR_LENGTH,
    )} ${end ? Time(end) : NO_TIME}`,
  );
}

export function playerEmbed(options?: EmbedOptions) {
  const response = [new MessageEmbed()];
  const [primary] = response;

  // primary.setColor('RANDOM');

  primary.setAuthor({ name: 'KSPlayer' });

  if (options) {
    const { title, url, currentTime, duration, thumbnail } = options;

    if (title) primary.setTitle(title);
    else primary.setTitle('no title');

    primary.setURL(url);

    if (thumbnail) primary.setThumbnail(thumbnail);

    primary.setDescription(timeProgressBar(currentTime, duration));
  } else {
    primary.setTitle('no title');
    primary.setDescription(timeProgressBar());
  }

  if (options && options.nextTracks?.length) {
    response.push(new MessageEmbed());
    const [_, queue] = response;

    const data = options.nextTracks.map((title) => `- ${title}`);
    queue.addField('next tracks', codeBlock(data.join('\n')), true);
  }

  return response;
}
