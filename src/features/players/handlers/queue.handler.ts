import { Injectable } from '@nestjs/common';

import { Handler, HandleCommand } from 'core/decorators';

@Injectable()
@Handler('queue')
export class QueueHandler {
  @HandleCommand('clean')
  clean() {
    return 'lol !';
  }
}
