import { request } from '../lib/http';
import type { Platform, Project } from '@design/shared-types';

export type ProjectPlatform = Platform;

export interface ProjectListParams {
  page?: number;
  pageSize?: number;
  platform?: ProjectPlatform;
  appName?: string;
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
    url: '/project',
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
