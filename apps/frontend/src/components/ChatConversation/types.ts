export interface ChatConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content?: string;
  images?: string[];
  createdAt?: string;
  metadata?: Record<string, unknown>;
  // whether this message is a loading placeholder (assistant thinking)
  loading?: boolean;
}

export interface UploadResultItem {
  url: string;
  name?: string;
}
