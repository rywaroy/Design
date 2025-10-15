import { request } from '../lib/http';
import type { Platform, Project } from '@design/shared-types';

export type ProjectPlatform = Platform;

export interface ProjectListParams {
  page?: number;
  pageSize?: number;
  platform?: ProjectPlatform;
  appName?: string;
  applicationType?: string | string[];
  industrySector?: string | string[];
}

export interface ProjectListItem extends Project {}

export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const getProjects = (params: ProjectListParams) =>
  request<PaginationResult<ProjectListItem>>({
    url: '/project/list',
    method: 'POST',
    data: params,
  });

export interface ProjectAiDimensionSelection {
  firstLevel: string[];
  secondLevel: string[];
  mapping: Record<string, string[]>;
}

export interface ProjectAiTags {
  applicationType: ProjectAiDimensionSelection;
  industrySector: ProjectAiDimensionSelection;
}

export interface ProjectAiDimensionIntent {
  relevant: boolean;
  reason?: string;
  confidence?: number;
}

export interface ProjectAiMeta {
  intent: Record<string, ProjectAiDimensionIntent>;
  notice?: string;
  rawResponses?: string[];
}

export interface ProjectAiSearchResponse {
  tags: ProjectAiTags;
  llmMeta: ProjectAiMeta;
  search: PaginationResult<ProjectListItem>;
}

export interface ProjectAiSearchParams {
  requirement: string;
  platform?: ProjectPlatform;
}

export const searchProjectsWithAI = (params: ProjectAiSearchParams) =>
  request<ProjectAiSearchResponse>({
    url: '/project/search/ai',
    method: 'POST',
    data: params,
  });

export interface ProjectFilterCategory {
  key: string;
  label: string;
  options: string[];
  parent?: string;
}

export interface ProjectFilterResponse {
  categories: ProjectFilterCategory[];
}

export const getProjectFilters = (params?: { category?: string; parent?: string }) =>
  request<ProjectFilterResponse>({
    url: '/project/filters',
    method: 'GET',
    params,
  });

export interface ProjectDetailResponse {
  project: Project;
}

export const getProjectDetail = (projectId: string) =>
  request<ProjectDetailResponse>({
    url: '/project/detail',
    method: 'GET',
    params: { projectId },
  });
