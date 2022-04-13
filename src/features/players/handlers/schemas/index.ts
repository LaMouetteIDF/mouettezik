import { PlayCommandSchema } from './PlayCommandSchema';
import { PauseCommandSchema } from './PauseCommandSchema';
import { NextCommandSchema } from './NextCommandSchema';
import { PreviousCommandSchema } from './PreviousCommandSchema';
import { StopCommandSchema } from './StopCommandSchema';
import { RepeatCommandSchema } from './RepeatCommandSchema.ts';
import { AddCommandSchema } from './AddCommandSchema';
import { QueueCommandSchema } from './QueueCommandSchema';

const PlayersCommandSchemas = [
  PlayCommandSchema,
  PauseCommandSchema,
  NextCommandSchema,
  PreviousCommandSchema,
  StopCommandSchema,
  RepeatCommandSchema,
  AddCommandSchema,
  QueueCommandSchema,
];

export { PlayersCommandSchemas };
