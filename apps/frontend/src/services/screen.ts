import { request } from '../lib/http';
import type { PaginationResult } from './project';

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
