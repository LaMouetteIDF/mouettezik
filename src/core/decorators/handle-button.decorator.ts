import { CustomDecorator, SetMetadata } from '@nestjs/common';

export const HANDLE_BUTTON_METADATA_KEY = '__ks_handle-button__';

export function HandleButton(buttonName: string): CustomDecorator;
export function HandleButton(
  buttonName: string,
  subButton: string,
): CustomDecorator;
export function HandleButton(
  subButtonGroup: string,
  subButton: string,
): CustomDecorator;
export function HandleButton(...buttons: string[]) {
  if (!buttons.length || buttons.length > 2) throw new Error('invalid params');
  return SetMetadata(HANDLE_BUTTON_METADATA_KEY, buttons);
}
