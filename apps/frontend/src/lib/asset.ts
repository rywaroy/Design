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

export const appendImageResizeParam = (url: string, width: number) => {
  const widthParamPattern = /imageView2\/2\/w\/\d+/;
  const [base, hash] = url.split('#');
  let updatedBase: string;

  if (widthParamPattern.test(base)) {
    updatedBase = base.replace(widthParamPattern, `imageView2/2/w/${width}`);
  } else {
    const hasQuery = base.includes('?');
    let separator = '?';

    if (hasQuery) {
      separator = base.endsWith('?') || base.endsWith('&') ? '' : '&';
    }

    updatedBase = `${base}${separator}imageView2/2/w/${width}`;
  }

  const normalizedBase = updatedBase.replace(/\?&/, '?');
  return hash ? `${normalizedBase}#${hash}` : normalizedBase;
};
