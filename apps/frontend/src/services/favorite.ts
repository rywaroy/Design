import { request } from '../lib/http';

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
