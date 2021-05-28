import { prefix, token } from "@config";

import { MusicBot } from "@core";

const musicBot = new MusicBot();
musicBot.setPrefix(prefix);
musicBot.connect(token);
