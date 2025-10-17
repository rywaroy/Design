import { request } from '../lib/http';

export type SessionStatus = 'active' | 'archived';

export interface SessionItem {
  _id: string;
  title: string;
  status: SessionStatus;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt?: string;
  updatedAt?: string;
  pinned?: boolean;
}

export interface ListSessionParams {
  page?: number;
  limit?: number;
}

export const listSessions = (params?: ListSessionParams) =>
  request<SessionItem[]>({
    url: '/sessions',
    method: 'GET',
    params,
  });

export const createSession = (data?: { title?: string }) =>
  request<SessionItem>({
    url: '/sessions',
    method: 'POST',
    data,
  });

export const updateSession = (sessionId: string, data: { title?: string }) =>
  request<SessionItem>({
    url: `/sessions/${sessionId}`,
    method: 'PATCH',
    data,
  });

export const removeSession = (sessionId: string) =>
  request<SessionItem>({
    url: `/sessions/${sessionId}`,
    method: 'DELETE',
  });

export interface MessageItem {
  _id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content?: string;
  images?: string[];
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListMessageParams {
  sessionId: string;
  limit?: number;
  before?: string;
}

export const listMessages = (params: ListMessageParams) =>
  request<MessageItem[]>({
    url: '/messages',
    method: 'GET',
    params,
  });

export interface ChatRequestPayload {
  sessionId: string;
  content?: string;
  images?: string[];
  model?: string;
  aspectRatio?: string;
}

export interface ChatResponsePayload {
  content?: string;
  images: string[];
  metadata?: Record<string, unknown>;
}

export const sendChatMessage = (data: ChatRequestPayload) =>
  request<ChatResponsePayload>({
    url: '/ai/chat',
    method: 'POST',
    data,
  });

export interface ModelItem {
  name: string;
  model: string;
  provider?: string;
  adapter: string;
  enabled: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const listModels = () =>
  request<ModelItem[]>({
    url: '/models',
    method: 'GET',
  });

export interface UploadedFileInfo {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  extension: string;
  uploadTime: string;
  url?: string;
}

export const uploadImages = (files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  return request<UploadedFileInfo[]>({
    url: '/file/upload-files',
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
