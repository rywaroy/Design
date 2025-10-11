import { RESOURCE_BASE_URL } from './constant';

export const resolveAssetUrl = (path?: string | null): string | undefined => {
  if (!path) {
    return undefined;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${RESOURCE_BASE_URL}/${path.replace(/^\/+/, '')}`;
};
