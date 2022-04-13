import { HANDLER_METADATA_KEY } from 'core/decorators/handler.decorator';
import { HANDLE_COMMAND_METADATA_KEY } from 'core/decorators/handle-command.decorator';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import {
  HandleType,
  HandleTypeDecoratorKey,
  HandleWrapper,
} from 'utils/handle/HandlerTypes';

export function getMetadataArrayString(
  metadataKey: string,
  target: object,
): string[] {
  if (!target) return undefined;
  const path = Reflect.getMetadata(metadataKey, target);
  if (!path || !Array.isArray(path)) return;
  for (const item of path) {
    if (typeof item !== 'string') {
      console.error('is not a string : ', item);
      throw new Error('Handle decorator params invalid params');
    }
  }
  return path;
}

export function hasHandlerDecorator(target: any): boolean {
  if (!target) return false;
  try {
    const metadata = Reflect.getMetadata(HANDLER_METADATA_KEY, target);
    return metadata && Array.isArray(metadata);
  } catch (e) {
    return false;
  }
}

export function getHandlerMetadata(target: any): string[] | undefined {
  if (!target) return undefined;
  return getMetadataArrayString(HANDLER_METADATA_KEY, target);
}

export function logDuplicatePath(handles: HandleWrapper[]) {
  const types = new Set(handles.map(({ type }) => type));

  for (const type of types) {
    const handlesType = handles.filter((handle) => handle.type === type);

    const allPathStr = handlesType.map(({ path }) => path.join(''));

    for (const pathStr of allPathStr) {
      const sameHandlesPath = handlesType.filter(
        ({ path }) => pathStr.toLowerCase() === path.join('').toLowerCase(),
      );

      if (sameHandlesPath.length > 1) {
        console.error(
          `${type} "${sameHandlesPath
            .shift()
            .path.join('/')}" is already register`,
        );
      }
    }
  }
}

export function getHandles(
  keys: HandleTypeDecoratorKey,
  handlers: InstanceWrapper[],
) {
  const handles: HandleWrapper[] = [];

  for (const handler of handlers) {
    const { metatype, instance } = handler;

    if (!metatype) continue;

    let rootPath: string[];

    try {
      rootPath = getHandlerMetadata(metatype);

      if (!rootPath) continue;
    } catch (e) {
      console.error(e);
      continue;
    }

    const protoKeys = Object.getOwnPropertyNames(metatype.prototype);

    for (const [type, decoratorKey] of Object.entries(keys) as [
      HandleType,
      string,
    ][]) {
      for (const key of protoKeys) {
        if (key === 'constructor') continue;

        if (typeof instance[key] !== 'function') continue;

        let path: string[] = [].concat(rootPath);

        try {
          const subPath = getMetadataArrayString(
            decoratorKey,
            metatype.prototype[key],
          );

          if (!subPath) continue;

          path = path.concat(subPath);
        } catch (e) {
          console.error(e);
          continue;
        }

        handles.push({
          type,
          path,
          metatype: metatype,
          instance,
          handleKey: key,
          handle: instance[key].bind(instance),
        });
      }
    }
  }

  logDuplicatePath(handles);

  return handles;
}

export function filterHandlers(wrappers: InstanceWrapper[]) {
  return wrappers.filter(({ metatype }) => !!getHandlerMetadata(metatype));
}

export function getHandleCommandMetadata(target: any): string[] | undefined {
  if (!target) return undefined;
  return getMetadataArrayString(HANDLE_COMMAND_METADATA_KEY, target);
}

export function getHandleMetadata(
  key: string,
  target: any,
): string[] | undefined {
  if (!target) return undefined;
  return getMetadataArrayString(key, target);
}

export function checkHandleCommandPathLength(handles: HandleWrapper[]) {
  for (const { path, metatype, handleKey } of handles) {
    if (!path.length || path.length > 3) {
      console.error(
        'command path : ',
        JSON.stringify(path),
        ' in ',
        metatype,
        handleKey,
        'function',
      );
      throw new Error('invalid command path length');
    }
  }
}

export function checkHandlePathName(
  type: HandleType,
  handles: HandleWrapper[],
) {
  const roots = handles.filter(({ path }) => path.length == 1);
  const subRoots = handles.filter(({ path }) => path.length == 2);
  const subRootGroups = handles.filter(({ path }) => path.length == 3);

  // check if duplicate root and if subRoot or subRootGroup are register
  for (const root of roots) {
    let count = 0;
    roots.forEach(({ path }) => {
      if (path[0] == root.path[0]) count++;
    });

    if (count > 1) throw new Error(type + ' is already register');

    for (const subRoot of subRoots) {
      if (root.path[0] === subRoot.path[0])
        throw new Error(
          'sub' +
            type +
            ' already register, cannot register "' +
            root.path[0] +
            '" simple ' +
            type,
        );
    }

    for (const subRootGroup of subRootGroups) {
      if (root.path[0] === subRootGroup.path[0])
        throw new Error(
          'sub' +
            type +
            'group already register, cannot register simple ' +
            type,
        );
    }
  }

  // check if duplicate subRoot and if subRootGroup are register
  for (const subRoot of subRoots) {
    let count = 0;
    subRoots.forEach(({ path }) => {
      if (path[1] === subRoot.path[1]) count++;
    });

    if (count > 1) throw new Error('sub' + type + ' has already register');

    for (const subCommandGroup of subRootGroups) {
      if (subRoot.path[1] === subCommandGroup.path[1])
        throw new Error(
          'sub' +
            type +
            'group has already register, cannot register sub' +
            type,
        );
    }
  }

  // check if duplicate subRoot in subRootGroup
  for (const subRootGroup of subRootGroups) {
    let count = 0;
    subRootGroups.forEach(({ path }) => {
      if (path[1] === subRootGroup.path[1]) count++;
    });

    if (count > 1)
      throw new Error(
        'sub' + type + ' in sub' + type + 'group has already register',
      );
  }
}
