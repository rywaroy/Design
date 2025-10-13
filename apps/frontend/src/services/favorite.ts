import { request } from '../lib/http';
import type { PaginationResult, ProjectListItem, ProjectPlatform } from './project';
import type { ScreenListItem } from './screen';

export interface FavoriteListParams {
  page?: number;
  pageSize?: number;
  platform?: ProjectPlatform;
}

export const getFavoriteProjects = (params: FavoriteListParams) =>
  request<PaginationResult<ProjectListItem>>({
    url: '/favorite/projects',
    method: 'GET',
    params,
  });

export const getFavoriteScreens = (params: FavoriteListParams) =>
  request<PaginationResult<ScreenListItem>>({
    url: '/favorite/screens',
    method: 'GET',
    params,
  });

export const favoriteProject = (projectId: string) =>
  request<boolean>({
    url: `/favorite/projects/${projectId}`,
    method: 'POST',
  });

export const unfavoriteProject = (projectId: string) =>
  request<boolean>({
    url: `/favorite/projects/${projectId}`,
    method: 'DELETE',
  });

export const favoriteScreen = (screenId: string) =>
  request<boolean>({
    url: `/favorite/screens/${screenId}`,
    method: 'POST',
  });

export const unfavoriteScreen = (screenId: string) =>
  request<boolean>({
    url: `/favorite/screens/${screenId}`,
    method: 'DELETE',
  });
