import { Resource } from '../Resource';
import { PlatformType } from '../../enums/PlatformType';

export class UnknownResource extends Resource {
  static readonly platform = PlatformType.Unknown;
  readonly platform = UnknownResource.platform;

  static isValidHost(): boolean {
    return true;
  }
}
