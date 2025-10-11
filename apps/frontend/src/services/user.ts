import { request } from '../lib/http';

export interface UserInfo {
  _id: string;
  username: string;
  roles: string[];
  createdAt?: string;
  updatedAt?: string;
}

export const getCurrentUser = () =>
  request<UserInfo>({
    url: '/user/info',
    method: 'GET',
  });
