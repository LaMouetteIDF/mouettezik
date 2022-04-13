import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';

import { HANDLE_COMMAND_METADATA_KEY } from 'core/decorators/handle-command.decorator';
import { HANDLE_BUTTON_METADATA_KEY } from 'core/decorators/handle-button.decorator';

import {
  HandleFunction,
  HandleType,
  HandleWrapper,
} from 'utils/handle/HandlerTypes';

import { getHandles } from 'utils/handle';

const handleDecoratorKeys: Record<HandleType, string> = {
  command: HANDLE_COMMAND_METADATA_KEY,
  button: HANDLE_BUTTON_METADATA_KEY,
};

export class HandleStore {
  constructor(private readonly handles: HandleWrapper[]) {}

  public getHandleCommand(command: string): HandleFunction;
  public getHandleCommand(command: string, subCommand): HandleFunction;
  public getHandleCommand(
    command: string,
    subCommandGroup: string,
    subCommand,
  ): HandleFunction;
  public getHandleCommand(...commands: string[]): HandleFunction {
    const handles = this.handles.filter(({ type }) => type === 'command');
    return handles.find(
      ({ path }) =>
        path.join('').toLowerCase() === commands.join('').toLowerCase(),
    )?.handle;
  }

  public getHandleButton(customId: string, char = ':') {
    const handles = this.handles.filter(({ type }) => type === 'button');

    const getPath = (path: string[]) => `${path.join(char)}${char}`;

    const handle = handles.find(({ path }) =>
      customId.startsWith(getPath(path)),
    );
    if (!handle) return undefined;

    const length = getPath(handle.path).length;

    return {
      payload: customId.substring(length),
      handle: handle.handle,
    };
  }

  static from(wrappers: InstanceWrapper[]) {
    return new HandleStore(getHandles(handleDecoratorKeys, wrappers));
  }
}
