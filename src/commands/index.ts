import { Message, VoiceChannel, Guild, EmbedField } from "discord.js";
import { Music } from "../music";
import { isYTPlaylist, getInfoYTPlaylist, getSongYT } from "../music/utils";

import { ServerQueue } from "../core/server-queue";

import {
  accessToVoiceChannelIsAllow,
  getVoicechannel,
  userIsInVoiceChannel,
  getGuild,
  getGuildID,
} from "./utils";

export function HelpCMD(message: Message, serverQueue: ServerQueue) {
  message.channel.send({
    embed: {
      color: 3447003,
      title: "Help Music Bot :",
      fields: [
        {
          name: "Commandes :",
          value:
            "!play [Play Options] [URL-YOUTUBE]\n!pause\n!next\n!prev\n!vol [number]\n!repeat [Repeat Options]!kill\n!help\n!list\n!clean",
        },
        {
          name: "Play Options :",
          value: "repeat, vol <0-15>",
        },
        {
          name: "Repeat Options :",
          value: "one",
        },
      ],
    },
  });
}

export async function PlayCMD(message: Message, serverQueue: ServerQueue) {
  // verification de l'access à un salon
  if (!userIsInVoiceChannel(message))
    return message.channel.send(
      "T'es con ou quoi tu dois être dans un salon vocal pour lancer la music"
    );
  if (!accessToVoiceChannelIsAllow(message))
    return message.channel.send(
      "Ton salon pue la merde j'ai pas envie de venir"
    );

  const voiceChannel = getVoicechannel(message);
  if (!voiceChannel) return;

  const guildID = getGuildID(message);
  if (!guildID) return;
  const guild = getGuild(message);
  if (!guild) return;

  const args = message.content.split(" ");
  let url = args[args.length - 1];
  if (args.length <= 1) url = "";

  if (!serverQueue.music) {
    if (url) {
      serverQueue.music = new Music(message);
      await serverQueue.music.add(url);
      if (isYTPlaylist(url))
        message.channel.send(`Playlist: **${await getInfoYTPlaylist(url)}**`);
      serverQueue.music.play();
    } else {
      return message.channel.send(
        "Tu fais quoi gros ta crue c'étais la fête !!"
      );
    }
    try {
      serverQueue.music.connection = await voiceChannel.join();
      serverQueue.music.play();
    } catch (err) {
      console.log(err);
      //Queue.delete(guildID);
      return message.channel.send("Je suis fatiguer là fait pas chier !!");
    }
  } else {
    // --------------------------------------------------
    if (serverQueue.music?.isPlaying && !serverQueue.music?.isStoping) {
      if (serverQueue.music?.connection?.status == 4)
        serverQueue.music?.connection.channel.join();
      if (url) {
        serverQueue.music?.add(url);
        if (isYTPlaylist(url)) {
          return message.channel.send(
            `La playlist **${await getInfoYTPlaylist(
              url
            )}** à été ajouter à la file d'attente!`
          );
        } else {
          return message.channel.send(
            `La musique **${
              (await getSongYT(url)).title
            }** à été ajouter à la file d'attente!`
          );
        }
      } else {
        message.channel.send("De la musique est deja en cours lecture");
      }
    } else {
      if (serverQueue.music?.isPaused) {
        serverQueue.music?.resume();
      } else {
        if (url) {
          const songs = await getSongYT(url);
          let track = serverQueue.music?.playlist.songs.length;
          serverQueue.music?.add(url);
          serverQueue.music?.play(track);
          if (isYTPlaylist(url)) {
            return message.channel.send(
              `La playlist **${await getInfoYTPlaylist(
                url
              )}** à été ajouter à la file d'attente.`
            );
          }
        } else {
          serverQueue.music?.play();
        }
      }
    }
  }
}

export async function PauseCMD(message: Message, serverQueue: ServerQueue) {
  if (!serverQueue.music?.isPlaying) {
    return message.channel.send("Aucune lecture n'est en cours");
  }

  serverQueue.music?.pause();
}

export async function StopCMD(message: Message, serverQueue: ServerQueue) {
  if (!message.member?.voice.channel)
    return message.channel.send("Viens me le dire en face si tu l'ose !!");

  if (!serverQueue.music?.isPlaying) {
    return message.channel.send("J'ai rien fait monsieur l'agent !!");
  }

  serverQueue.music?.stop();
}

export async function NextCMD(message: Message, serverQueue: ServerQueue) {
  if (!serverQueue.music?.isPlaying) {
    return message.channel.send("Aucune lecture n'est en cours");
  }

  serverQueue.music?.next();
}

export async function PrevCMD(message: Message, serverQueue: ServerQueue) {
  if (!serverQueue.music?.isPlaying) {
    return message.channel.send("Aucune lecture n'est en cours");
  }

  serverQueue.music?.prev();
}

export function KillCMD(message: Message, serverQueue: ServerQueue) {
  return message.channel.send("ça arrive bientôt");
  //return message.channel.send("Je bouge pas y a quoi ?!!");
}

export function VolumeCMD(message: Message, serverQueue: ServerQueue) {
  if (!serverQueue.music?.isPlaying) {
    return message.channel.send("Aucune lecture n'est en cours");
  }

  const args = message.content.split(" ");
  if (!args[1]) {
    return message.channel.send(
      `Le volume actuel est à ${serverQueue.music?.volume}`
    );
  }
  let volume = parseFloat(args[1]);
  if (isNaN(volume) || volume < 0 || volume > 15) {
    return message.channel.send("Commande incorrect (ex: !vol <0-15>)");
  }
  if (serverQueue.music) serverQueue.music.volume = volume;
}

export function RepeatCMD(message: Message, serverQueue: ServerQueue) {
  if (!serverQueue.music?.isPlaying) {
    return message.channel.send("Aucune lecture n'est en cours");
  }

  const args = message.content.split(" ");
  const subCommand = args[1];
  if (subCommand && subCommand == "one") {
    if (serverQueue.music) {
      serverQueue.music.repeat.state = true;
      serverQueue.music.repeat.value = "ONE";
    }
    return message.channel.send("La music actuel sera lu en boucle");
  } else if (subCommand && subCommand != "one") {
    return message.channel.send(
      "Commande incorrect (ex: !repeat | !repeat one)"
    );
  }
  if (serverQueue.music?.repeat.state) {
    serverQueue.music.repeat.state = false;
    return message.channel.send("La playlist sera lu est boucle.");
  } else {
    serverQueue.music.repeat.state = true;
    serverQueue.music.repeat.value = "ALL";
    return message.channel.send("La playlist ne sera plus lu est boucle.");
  }
}

export function ListCMD(message: Message, serverQueue: ServerQueue) {
  if (serverQueue.music?.playlist.songs.length == 0) {
    return message.channel.send("Dégage il y a rien pour toi ici!!");
  }

  let list = "\n**Liste de lecture :**\n";

  serverQueue.music?.playlist.songs.forEach((item, index) => {
    if (index != 0) list += "\n";
    list += `**${index} -** ${item.title}`;
  });

  message.channel.send(list);
}

export function CleanCMD(message: Message, serverQueue: ServerQueue) {
  if (serverQueue.music?.playlist.songs.length == 0) {
    return message.channel.send(
      "Vas nettoyer tes fesses et me fait pas chier!!"
    );
  }

  serverQueue.music?.clean();
  message.channel.send("Je suis tous propre :blush:");
}
