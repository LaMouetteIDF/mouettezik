import { PlayerState } from 'core/player/Player';
import { playerEmbed } from './embed';
import { MessageActionRow } from 'discord.js';
import {
  nextButton,
  pauseButton,
  playButton,
  previousButton,
  repeatButton,
  stopButton,
} from './buttons';
import { PlayerStatus } from 'core/enums/PlayerStatus';
import { VoiceStatus } from 'core/enums/VoiceStatus';

export function embedFromPlayerState(state?: PlayerState) {
  let currentTime: number = state.player.currentPlayingTime;
  if (
    state.status === PlayerStatus.Stop ||
    !state.player.voice ||
    state.player.voice.state.status === VoiceStatus.Idle ||
    state.player.state.current !== state.player.voice.state.track
  )
    currentTime = 0;

  return state
    ? playerEmbed({
        title: state.current && state.current.title,
        url: state.current && state.current.url,
        thumbnail: state.current && state.current.thumbnail,
        currentTime,
        duration: state.current && state.current.duration,
        // nextTracks: state.queue
        //   .slice(state.queue.index, state.queue.index + 3)
        //   .map((track) => track.title),
      })
    : playerEmbed();
}

function getPlayerButtons(
  payload: string,
  playing: boolean,
  stopped: boolean,
  repeat: 'none' | 'all' | 'one',
  disabled = false,
) {
  return new MessageActionRow().setComponents(
    previousButton(payload, disabled), // disabled for development
    playing ? pauseButton(payload, disabled) : playButton(payload, disabled),
    nextButton(payload, disabled), // disabled for development
    stopButton(payload, stopped ?? disabled),
    repeatButton(payload, repeat, disabled), // disabled for development
  );
}

export function disabledButtons() {
  return new MessageActionRow().setComponents(
    previousButton('', true),
    playButton('', true),
    nextButton('', true),
    stopButton('', true),
    repeatButton('', 'none', true),
  );
}

export function playerActions(state?: PlayerState) {
  return [
    state
      ? getPlayerButtons(
          state.id,
          state.status === PlayerStatus.Play,
          state.status === PlayerStatus.Stop,
          state.repeat,
        )
      : disabledButtons(),
  ];
}

export function playerViewMessageResponse(state?: PlayerState) {
  return {
    embeds: embedFromPlayerState(state),
    components: playerActions(state),
  };
}
