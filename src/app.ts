import { prefix, token } from "../config.json";

import { MusicBot } from "./core";

const musicBot = new MusicBot();
musicBot.setPrefix(prefix);
musicBot.connect(token);
