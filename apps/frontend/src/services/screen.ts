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
  platform?: ProjectPlatform | ProjectPlatform[];
  projectId?: string;
  pageTypeL2?: string | string[];
  appCategoryL2?: string | string[];
  designSystem?: string | string[];
  typeL2?: string | string[];
  spacing?: string | string[];
  density?: string | string[];
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

export interface ScreenAiDimensionSelection {
  firstLevel: string[];
  secondLevel: string[];
  mapping: Record<string, string[]>;
}

export interface ScreenAiTags {
  appCategory: ScreenAiDimensionSelection;
  componentIndex: ScreenAiDimensionSelection;
  layoutType: ScreenAiDimensionSelection;
  pageType: ScreenAiDimensionSelection;
  tagsPrimary: ScreenAiDimensionSelection;
  tagsStyle: ScreenAiDimensionSelection;
  tagsComponents: ScreenAiDimensionSelection;
}

export interface ScreenAiDimensionIntent {
  relevant: boolean;
  reason?: string;
  confidence?: number;
}

export interface ScreenAiMeta {
  intent: Record<string, ScreenAiDimensionIntent>;
  notice?: string;
  rawResponses?: string[];
}

export interface ScreenAiSearchResponse {
  tags: ScreenAiTags;
  llmMeta: ScreenAiMeta;
  search: PaginationResult<ScreenListItem>;
}

export interface ScreenAiSearchParams {
  requirement: string;
  platform?: ProjectPlatform;
  projectId?: string;
}

export const searchScreensWithAI = (params: ScreenAiSearchParams) =>
  request<ScreenAiSearchResponse>({
    url: '/screen/search/ai',
    method: 'POST',
    data: params,
  });

export interface ScreenFilterCategory {
  key: string;
  label: string;
  options: string[];
  parent?: string;
}

export interface ScreenFilterResponse {
  categories: ScreenFilterCategory[];
}

export const getScreenFilters = (params?: { category?: string; parent?: string }) =>
  request<ScreenFilterResponse>({
    url: '/screen/filters',
    method: 'GET',
    params,
  });
