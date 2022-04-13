export * from './SnowflakeUtil';

export class Util {
  static getOnlyKeys<T extends object = any>(
    keys: string[],
    input: Record<string, any>,
  ): T {
    const obj: Record<string, any> = {};

    for (const key of keys) obj[key] = input[key];

    return Object.assign({}, obj) as T;
  }
}
