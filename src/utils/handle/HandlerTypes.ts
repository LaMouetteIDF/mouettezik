export type HandleFunction<T = any> = (...arg: any[]) => T | Promise<T>;

export type HandleType = 'command' | 'button';

export type HandleTypeDecoratorKey = Record<HandleType, string>;

export type HandleWrapper = {
  type: HandleType;
  path: string[];
  metatype: any;
  instance: any;
  handleKey: string;
  handle: HandleFunction;
};
