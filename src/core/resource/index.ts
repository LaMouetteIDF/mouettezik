import { YoutubeResource } from './platform/YoutubeResource';
import { UnknownResource } from './platform/UnknownResource';
import { Resource } from './Resource';
import { IResourceBase } from '../abstract/IResourceBase';
import { PlatformType } from '../enums/PlatformType';

const PLATFORMS: Array<typeof Resource> = [
  YoutubeResource as any,
  UnknownResource,
];

export async function getResourceByURL(
  url: string,
): Promise<IResourceBase<true>> {
  const resource = PLATFORMS.find((resource) => resource.isValidHost(url));
  return await new resource(url).fetch();
}

export function getResource(platform: PlatformType): typeof Resource {
  const resource = PLATFORMS.find((resource) => resource.platform === platform);
  if (!resource) throw new Error(`resource "${platform}" not found `);
  return resource;
}
