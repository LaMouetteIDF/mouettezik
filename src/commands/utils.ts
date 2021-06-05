import { Message, VoiceChannel, Guild } from 'discord.js';
import { isYTURL } from '../music/utils';

export function getTextChannel(message: Message) {
  return message.channel;
}

export function getVoicechannel(message: Message): VoiceChannel | null {
  const v = message.member?.voice.channel;
  if (!v) {
    message.channel.send('Je suis fatiguer là fait pas chier !!');
    return null;
  }
  return v;
}

export function userIsInVoiceChannel(message: Message): boolean {
  return message.member?.voice.channel ? true : false;
}

export function accessToVoiceChannelIsAllow(message: Message): boolean {
  const voiceChannel = message.member?.voice.channel;
  if (!voiceChannel) return false;
  if (message.client.user) {
    const permissions = voiceChannel?.permissionsFor(message.client.user);
    if (permissions)
      if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
        return false;
      }
  } else {
    return false;
  }
  return true;
}

export function getGuildID(message: Message) {
  const id = message.guild?.id;
  if (!id) {
    message.channel.send('Je suis fatiguer là fait pas chier !!');
    return null;
  }
  return id;
}

export function getGuild(message: Message): Guild | null {
  const guild = message.guild;
  if (!guild) {
    message.channel.send('Je suis fatiguer là fait pas chier !!');
    return null;
  }
  return guild;
}

export function getPLayARGS(arg: string) {
  const argsT = arg.split(' ');

  const Args = {
    url: '',
    track: -1,
    repeat: '',
    volume: -1,
  };

  const rgxReapeat = / (repeat) ?(one|all)? /;
  const argRepeat = arg.match(rgxReapeat);
  if (argRepeat) {
    if (argRepeat[2] == 'one') Args.repeat = 'ONE';
    else Args.repeat = 'ALL';
  }

  const rgxVolume = / vol ([0-9]+\.?[0-9]*)/;
  const argVolume = arg.match(rgxVolume);

  if (argVolume) {
    const vol = parseFloat(argVolume[1]);
    if (!isNaN(vol)) Args.volume = vol;
  }

  const lastArg = argsT[argsT.length - 1];

  if (isYTURL(lastArg)) Args.url = lastArg;
  else {
    const track = parseInt(lastArg, 10);
    if (!isNaN(track)) Args.track = track;
  }

  return Args;
}
