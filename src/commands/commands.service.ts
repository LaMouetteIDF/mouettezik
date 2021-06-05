import { Injectable } from '@nestjs/common';

import { Message, VoiceChannel, Guild, EmbedField } from 'discord.js';
import { Music } from '@/music';
import { isYTPlaylist, getInfoYTPlaylist, getSongYT } from '@/music/utils';

import { Queue, ServerQueue } from '@/core/server-queue';

import {
  accessToVoiceChannelIsAllow,
  getVoicechannel,
  userIsInVoiceChannel,
  getGuild,
  getGuildID,
  getTextChannel,
  getPLayARGS,
} from './utils';

type Command =
  | 'help'
  | 'play'
  | 'pause'
  | 'stop'
  | 'next'
  | 'prev'
  | 'kill'
  | 'volume'
  | 'repeat'
  | 'list'
  | 'clean';

const ErrorString = {
  Add: "**Erreur:** Une erreur s'est produite lors de l'ajout, veuillez essayer la commande (!kill) avant de contacter l'administrateur",
  Play: "**Erreur:** Une erreur c'est produite lors de la lecture",
};

const getStringSendMSG = {
  AddPlaylistInQueue: (title: string) =>
    `La playlist **${title}** à été ajouter à la file d'attente!`,
  AddMusicInQueue: (title: string) =>
    `La musique **${title}** à été ajouter à la file d'attente!`,
};

@Injectable()
export class CommandsService {
  private listCommands = [];

  constructor() {
    for (const func of Object.getOwnPropertyNames(CommandsService.prototype)) {
      const rgx = /(\w+)CMD/;
      const cmdArraySTR = func.match(rgx);
      if (cmdArraySTR) this.listCommands.push(cmdArraySTR[1]);
    }
  }

  isExistCommand(cmdRequest: string): boolean {
    for (const cmd of this.listCommands) {
      if (cmd == cmdRequest) return true;
    }
    return false;
  }

  getExec(cmd: string): (message: Message, serverQueue: ServerQueue) => void {
    return this[`${cmd}CMD`];
  }

  private helpCMD(message: Message, serverQueue: ServerQueue) {
    message.channel.send({
      embed: {
        color: 3447003,
        title: 'Help Music Bot :',
        fields: [
          {
            name: 'Commandes :',
            value:
              '!clean\n!help\n!kill\n!list\n!next\n!pause\n!play [Play Options] [URL-YOUTUBE]\n!prev\n!vol [number]\n!repeat [Repeat Options]\n',
          },
          {
            name: 'Play Options :',
            value: 'repeat, vol <0-100>',
          },
          {
            name: 'Repeat Options :',
            value: 'one',
          },
        ],
      },
    });
  }

  private async playCMD(message: Message, serverQueue: ServerQueue) {
    // verification de l'access à un salon
    if (!userIsInVoiceChannel(message))
      return message.channel.send(
        "T'es con ou quoi tu dois être dans un salon vocal pour lancer la music",
      );
    if (!accessToVoiceChannelIsAllow(message))
      return message.channel.send(
        "Ton salon pue la merde j'ai pas envie de venir",
      );

    const voiceChannel = getVoicechannel(message);
    if (!voiceChannel) return;

    const guildID = getGuildID(message);
    if (!guildID) return;
    const guild = getGuild(message);
    if (!guild) return;

    const Args = getPLayARGS(message.content);
    // if (!Args) {
    //   message.channel.send("Argumant invalide")
    //   return HelpCMD(message, serverQueue)
    // }

    if (!serverQueue.music)
      serverQueue.music = new Music(voiceChannel, getTextChannel(message));

    const args = message.content.split(' ');
    let url = args[args.length - 1];
    if (args.length <= 1) url = '';

    let target = args[args.length - 1];
    if (args.length <= 1) target = '';

    const music = serverQueue.music;
    if (!music) return;

    if (music.isPlaying) {
      if (Args.url) {
        if (!(await serverQueue.music.add(url))) {
          return message.channel.send(ErrorString.Add);
        }
        if (isYTPlaylist(url)) {
          return message.channel.send(
            getStringSendMSG.AddPlaylistInQueue(await getInfoYTPlaylist(url)),
          );
        } else {
          return message.channel.send(
            getStringSendMSG.AddMusicInQueue((await getSongYT(url)).title),
          );
        }
      } else if (Args.track != -1) {
        if (music.playlist.songs[Args.track]) {
          if (!(await music.play(Args.track))) {
            return message.channel.send(
              '**Erreur:** Impossible de lire la piste',
            );
          }
          if (Args.volume != -1) music.volume = Args.volume;
          if (Args.repeat == 'ALL') {
            music.repeat.state = true;
            music.repeat.value == 'ALL';
          } else if (Args.repeat == 'ONE') {
            music.repeat.state = true;
            music.repeat.value == 'ONE';
          }
          return;
        } else {
          return message.channel.send(
            '**Erreur:** Track non present dans la playlist',
          );
        }
      } else {
        return message.channel.send('De la musique est deja en cours lecture');
      }
    }

    if (music.isPaused) return music.resume();

    if (Args.url) {
      let track = music.playlist.songs.length;
      if (!(await music.add(Args.url)))
        return message.channel.send(ErrorString.Add);

      if (Args.volume != -1) music.volume = Args.volume;
      if (Args.repeat == 'ALL') {
        music.repeat.state = true;
        music.repeat.value == 'ALL';
      } else if (Args.repeat == 'ONE') {
        music.repeat.state = true;
        music.repeat.value == 'ONE';
      }
      if (!(await music.play(track)))
        return message.channel.send(ErrorString.Play);
      return;
    }

    if (music.playlist.songs.length > 0) {
      if (!(await music.play())) return message.channel.send(ErrorString.Play);
      return;
    }

    return message.channel.send("Ta cru c'étais la fête ou quoi parle mieux!");
  }

  private async pauseCMD(message: Message, serverQueue: ServerQueue) {
    if (!serverQueue.music?.isPlaying) {
      return message.channel.send("Aucune lecture n'est en cours");
    }

    serverQueue.music?.pause();
  }

  private async stopCMD(message: Message, serverQueue: ServerQueue) {
    if (!message.member?.voice.channel)
      return message.channel.send("Viens me le dire en face si tu l'ose !!");

    if (!serverQueue.music?.isPlaying) {
      return message.channel.send("J'ai rien fait monsieur l'agent !!");
    }

    serverQueue.music?.stop();
  }

  private async nextCMD(message: Message, serverQueue: ServerQueue) {
    if (!serverQueue.music?.isPlaying) {
      return message.channel.send("Aucune lecture n'est en cours");
    }

    serverQueue.music?.next();
  }

  private async prevCMD(message: Message, serverQueue: ServerQueue) {
    if (!serverQueue.music?.isPlaying) {
      return message.channel.send("Aucune lecture n'est en cours");
    }

    serverQueue.music?.prev();
  }

  private killCMD(message: Message, serverQueue: ServerQueue) {
    if (serverQueue.music) {
      serverQueue.music.kill();
    }

    let guildID = message.guild?.id;
    if (!guildID)
      return message.channel.send('je suis au chiote là me fait pas chier !!');

    Queue.delete(guildID);

    return message.channel.send('Je reviendrai !!');
    //return message.channel.send("Je bouge pas y a quoi ?!!");
  }

  private volumeCMD(message: Message, serverQueue: ServerQueue) {
    if (!serverQueue.music?.isPlaying) {
      return message.channel.send("Aucune lecture n'est en cours");
    }

    const args = message.content.split(' ');
    if (!args[1]) {
      return message.channel.send(
        `Le volume actuel est à ${serverQueue.music?.volume}`,
      );
    }
    let volume = parseFloat(args[1]);
    if (isNaN(volume) || volume < 0 || volume > 100) {
      return message.channel.send('Commande incorrect (ex: !vol <0-100>)');
    }
    if (serverQueue.music) serverQueue.music.volume = volume;
  }

  private repeatCMD(message: Message, serverQueue: ServerQueue) {
    if (!serverQueue.music?.isPlaying) {
      return message.channel.send("Aucune lecture n'est en cours");
    }

    const args = message.content.split(' ');
    const subCommand = args[1];
    if (subCommand && subCommand == 'one') {
      if (serverQueue.music) {
        serverQueue.music.repeat.state = true;
        serverQueue.music.repeat.value = 'ONE';
      }
      return message.channel.send('La music actuel sera lu en boucle');
    } else if (subCommand && subCommand != 'one') {
      return message.channel.send(
        'Commande incorrect (ex: !repeat | !repeat one)',
      );
    }
    if (serverQueue.music?.repeat.state) {
      serverQueue.music.repeat.state = false;
      return message.channel.send('La playlist sera lu est boucle.');
    } else {
      serverQueue.music.repeat.state = true;
      serverQueue.music.repeat.value = 'ALL';
      return message.channel.send('La playlist ne sera plus lu est boucle.');
    }
  }

  private listCMD(message: Message, serverQueue: ServerQueue) {
    if (!serverQueue.music || serverQueue.music.playlist.songs.length == 0) {
      return message.channel.send('Dégage il y a rien pour toi ici !!');
    }

    let list = '\n**Liste de lecture :**\n';

    serverQueue.music?.playlist.songs.forEach((item, index) => {
      if (index != 0) list += '\n';
      list += `**${index} -** ${item.title}`;
    });

    message.channel.send(list);
  }

  private cleanCMD(message: Message, serverQueue: ServerQueue) {
    if (!serverQueue.music || serverQueue.music.playlist.songs.length == 0) {
      return message.channel.send(
        'Vas nettoyer tes fesses et me fait pas chier!!',
      );
    }

    serverQueue.music.clean();
    message.channel.send('Je suis tous propre :blush:');
  }
}
