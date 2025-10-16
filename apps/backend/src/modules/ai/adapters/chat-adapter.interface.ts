import { AiChatRequestDto, AiChatResponseDto } from '../dto/ai-chat.dto';
import {
  MessageDocument,
  MessageRole,
} from '../../message/entities/message.entity';

export interface ChatAdapterUserRecord {
  content?: string;
  images: string[];
  model?: string;
}

export interface ChatAdapterAssistantRecord extends ChatAdapterUserRecord {
  metadata?: Record<string, unknown>;
  role?: MessageRole;
}

export interface AdapterPreparedRequest<
  THistory = unknown,
  TRequest = unknown,
> {
  history: THistory;
  userRequest: TRequest;
  userRecord: ChatAdapterUserRecord;
  model: string;
  endpoint?: {
    baseUrl?: string;
    apiKey?: string;
  };
}

export interface AdapterNormalizedResponse {
  assistantRecord: ChatAdapterAssistantRecord & { model: string };
  response: AiChatResponseDto;
}

export interface AiChatAdapter<
  THistory = unknown,
  TRequest = unknown,
  TRawResponse = unknown,
> {
  readonly name: string;
  prepare(
    dto: AiChatRequestDto,
    history: MessageDocument[],
  ): Promise<AdapterPreparedRequest<THistory, TRequest>>;
  send(
    prepared: AdapterPreparedRequest<THistory, TRequest>,
  ): Promise<TRawResponse>;
  normalize(
    raw: TRawResponse,
    prepared: AdapterPreparedRequest<THistory, TRequest>,
  ): Promise<AdapterNormalizedResponse>;
}
