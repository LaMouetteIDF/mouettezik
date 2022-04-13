import { MessageButton } from 'discord.js';

export function playButton(playerId: string, disable = false) {
  return new MessageButton()
    .setCustomId(`play:${playerId}`)
    .setStyle('PRIMARY')
    .setLabel('▶')
    .setDisabled(disable);
}

export function pauseButton(playerId: string, disable = false) {
  return new MessageButton()
    .setCustomId(`pause:${playerId}`)
    .setStyle('SUCCESS')
    .setLabel('⏸')
    .setDisabled(disable);
}

export function nextButton(playerId: string, disable = false) {
  return new MessageButton()
    .setCustomId(`next:${playerId}`)
    .setStyle('SECONDARY')
    .setLabel('⏩')
    .setDisabled(disable);
}

export function previousButton(playerId: string, disable = false) {
  return new MessageButton()
    .setCustomId(`previous:${playerId}`)
    .setStyle('SECONDARY')
    .setLabel('⏪')
    .setDisabled(disable);
}

export function stopButton(playerId: string, disable = false) {
  return new MessageButton()
    .setCustomId(`stop:${playerId}`)
    .setStyle('DANGER')
    .setLabel('⏹')
    .setDisabled(disable);
}

export function repeatButton(
  playerId: string,
  state?: 'none' | 'one' | 'all',
  disable = false,
) {
  switch (state) {
    case 'one':
      return new MessageButton()
        .setCustomId(`repeat:${playerId}`)
        .setStyle('SUCCESS')
        .setLabel('🔂')
        .setDisabled(disable);
    case 'all':
      return new MessageButton()
        .setCustomId(`repeat:${playerId}`)
        .setStyle('PRIMARY')
        .setLabel('🔁')
        .setDisabled(disable);
    default:
      return new MessageButton()
        .setCustomId(`repeat:${playerId}`)
        .setStyle('SECONDARY')
        .setLabel('🔁')
        .setDisabled(disable);
  }
}
