import { request } from '../lib/http';
import type { PaginationResult, ProjectPlatform } from './project';

export interface ScreenListParams {
  projectId: string;
  page?: number;
  pageSize?: number;
}

export interface ScreenListItem {
  screenId: string;
  projectId: string;
  url?: string;
  originalUrl?: string;
  isFavorite?: boolean;
  isRecommended?: boolean;
  pageType?: string;
  pageTypeL2?: string;
  platform?: string;
  tagsPrimary?: string[];
  tagsPrimaryL2?: string[];
  tagsStyle?: string[];
  tagsStyleL2?: string[];
  tagsComponents?: string[];
  tagsComponentsL2?: string[];
  designSystem?: string;
  intent?: string | string[];
  type?: string | string[];
  typeL2?: string | string[];
  componentIndex?: string[];
  componentIndexL2?: string[];
  tags?: string[];
  [key: string]: unknown;
}

export const getProjectScreens = (params: ScreenListParams) =>
  request<PaginationResult<ScreenListItem>>({
    url: '/screen',
    method: 'GET',
    params,
  });

export interface ScreenSearchParams {
  page?: number;
  pageSize?: number;
  platform?: ProjectPlatform;
  projectId?: string;
  pageTypeL2?: string;
  appCategoryL2?: string;
  designSystem?: string;
  typeL2?: string;
  spacing?: string;
  density?: string;
  componentIndexL2?: string[];
  tagsPrimaryL2?: string[];
  tagsStyleL2?: string[];
  tagsComponentsL2?: string[];
  designStyle?: string[];
  feeling?: string[];
}

export const searchScreens = (params: ScreenSearchParams) =>
  request<PaginationResult<ScreenListItem>>({
    url: '/screen/search/precise',
    method: 'POST',
    data: params,
  });

export interface ScreenFilterResponse {
  pageTypeL2: string[];
  appCategoryL2: string[];
  designSystem: string[];
  typeL2: string[];
  spacing: string[];
  density: string[];
  componentIndexL2: string[];
  tagsPrimaryL2: string[];
  tagsStyleL2: string[];
  tagsComponentsL2: string[];
  designStyle: string[];
  feeling: string[];
  platform: string[];
}

export const getScreenFilters = () =>
  request<ScreenFilterResponse>({
    url: '/screen/filters',
    method: 'GET',
  });
