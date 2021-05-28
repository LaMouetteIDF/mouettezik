import { Message, VoiceChannel, Guild } from "discord.js";

export function getVoicechannel(message: Message): VoiceChannel | null {
  const v = message.member?.voice.channel;
  if (!v) {
    message.channel.send("Je suis fatiguer là fait pas chier !!");
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
      if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
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
    message.channel.send("Je suis fatiguer là fait pas chier !!");
    return null;
  }
  return id;
}

export function getGuild(message: Message): Guild | null {
  const guild = message.guild;
  if (!guild) {
    message.channel.send("Je suis fatiguer là fait pas chier !!");
    return null;
  }
  return guild;
}
