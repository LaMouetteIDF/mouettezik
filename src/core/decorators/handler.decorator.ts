import { CustomDecorator, SetMetadata } from '@nestjs/common';

export const HANDLER_METADATA_KEY = '__ks_handler__';

export function Handler(): CustomDecorator;
export function Handler(commandName: string): CustomDecorator;
export function Handler(
  commandName: string,
  subCommandGroup: string,
): CustomDecorator;
export function Handler(...commands: string[]) {
  if (commands.length > 2) throw new Error('invalid params');
  return SetMetadata(HANDLER_METADATA_KEY, commands);
}
