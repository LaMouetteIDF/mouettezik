import { CustomDecorator, SetMetadata } from '@nestjs/common';

export const HANDLE_COMMAND_METADATA_KEY = '__ks_handle-command__';

export function HandleCommand(commandName: string): CustomDecorator;
export function HandleCommand(
  commandName: string,
  subCommand: string,
): CustomDecorator;
export function HandleCommand(
  subCommandGroup: string,
  subCommand: string,
): CustomDecorator;
export function HandleCommand(...commands: string[]) {
  if (!commands.length || commands.length > 2)
    throw new Error('invalid params');
  return SetMetadata(HANDLE_COMMAND_METADATA_KEY, commands);
}

// export const HandleCommand = (...args: string[]) =>
//   SetMetadata('handle-command', args);
