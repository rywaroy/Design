import { request } from '../lib/http';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  id: string;
  username: string;
  roles: string[];
}

export interface LogoutResponse {
  message: string;
}

export const login = (payload: LoginPayload) =>
  request<LoginResponse>({
    url: '/auth/login',
    method: 'POST',
    data: payload,
  });

export const logout = () =>
  request<LogoutResponse>({
    url: '/auth/logout',
    method: 'POST',
  });
