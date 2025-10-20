import type { UploadResultItem } from './types';
import { uploadImages } from '../../services/chat';

export const DEFAULT_ASPECT_RATIO_OPTIONS = [
  { label: '不限', value: '' },
  { label: '1:1', value: '1:1' },
  { label: '2:3', value: '2:3' },
  { label: '3:2', value: '3:2' },
  { label: '3:4', value: '3:4' },
  { label: '4:3', value: '4:3' },
  { label: '4:5', value: '4:5' },
  { label: '5:4', value: '5:4' },
  { label: '9:16', value: '9:16' },
  { label: '16:9', value: '16:9' },
  { label: '21:9', value: '21:9' },
];

export const DEFAULT_PLACEHOLDER = '输入描述，按 Enter 发送，Shift + Enter 换行';

export const scrollToBottom = (container?: HTMLDivElement | null) => {
  if (!container) return;
  container.scrollTop = container.scrollHeight;
};

export const formatDatetime = (value?: string) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '';
  }
};

export const deriveSessionTitle = (content?: string, fallbackTitle = '新对话') => {
  if (!content) {
    return fallbackTitle;
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return fallbackTitle;
  }

  return trimmed.length > 20 ? `${trimmed.slice(0, 20)}...` : trimmed;
};

export const normalizeUploadResult = (
  items: Awaited<ReturnType<typeof uploadImages>>['data'],
): UploadResultItem | null => {
  if (!items || items.length === 0) {
    return null;
  }
  const target = items[0];
  if (!target?.url) {
    return null;
  }
  return {
    url: target.url,
    name: target.originalname,
  };
};

