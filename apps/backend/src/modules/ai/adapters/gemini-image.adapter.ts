import axios, { AxiosInstance, AxiosError } from 'axios';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AiChatRequestDto } from '../dto/ai-chat.dto';
import {
  GeminiContent,
  GeminiGenerateContentRequest,
  GeminiGenerateContentResponse,
  GeminiInlineData,
  GeminiPart,
  GeminiRole,
} from '../providers/gemini.types';
import {
  AdapterNormalizedResponse,
  AdapterPreparedRequest,
  AiChatAdapter,
  ChatAdapterAssistantRecord,
  ChatAdapterUserRecord,
} from './chat-adapter.interface';
import {
  MessageDocument,
  MessageRole,
} from '../../message/entities/message.entity';

@Injectable()
export class GeminiImageAdapter
  implements
    AiChatAdapter<
      GeminiContent[],
      GeminiGenerateContentRequest,
      GeminiGenerateContentResponse
    >
{
  readonly name = 'Gemini Image';
  private readonly logger = new Logger(GeminiImageAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  private buildHttpClient(baseUrlOverride?: string): AxiosInstance {
    const baseUrl =
      baseUrlOverride?.trim() ||
      this.configService.get<string>('ai.baseUrl') ||
      'https://generativelanguage.googleapis.com';
    const timeout = this.configService.get<number>('ai.timeoutMs') || 20000;

    return axios.create({
      baseURL: baseUrl,
      timeout,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private resolveApiKey(override?: string): string {
    const key =
      override?.trim() || this.configService.get<string>('ai.apiKey') || '';
    if (!key) {
      this.logger.error('AI_API_KEY 未配置');
      throw new InternalServerErrorException('AI 服务未正确配置');
    }
    return key;
  }

  private get imageModel(): string {
    return (
      this.configService.get<string>('ai.imageModel') ||
      'gemini-2.5-flash-image'
    );
  }

  async prepare(
    dto: AiChatRequestDto,
    history: MessageDocument[],
  ): Promise<
    AdapterPreparedRequest<GeminiContent[], GeminiGenerateContentRequest>
  > {
    const contents = await this.buildConversationContext(history);
    const { parts: userParts, record: userRecord } =
      await this.prepareUserMessage(dto);

    if (!userParts.length) {
      throw new BadRequestException('消息内容不能为空');
    }

    contents.push({
      role: 'user',
      parts: userParts,
    });

    const model = dto.model || this.imageModel;

    const aspectRatio = dto.aspectRatio?.trim() || '1:1';

    return {
      history: contents,
      userRequest: {
        contents,
        generationConfig: {
          // 允许模型返回图片或文字任一形式
          responseModalities: ['Image', 'Text'],
          imageConfig: {
            aspectRatio,
          },
        },
      },
      userRecord,
      model,
    };
  }

  async send(
    prepared: AdapterPreparedRequest<
      GeminiContent[],
      GeminiGenerateContentRequest
    >,
  ): Promise<GeminiGenerateContentResponse> {
    const client = this.buildHttpClient(prepared.endpoint?.baseUrl);
    const modelId = prepared.model;
    try {
      const response = await client.post<GeminiGenerateContentResponse>(
        `/v1beta/models/${modelId}:generateContent`,
        prepared.userRequest,
        {
          params: { key: this.resolveApiKey(prepared.endpoint?.apiKey) },
        },
      );
      await this.enrichResponseWithImageUrls(response.data);
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
    }
  }

  async normalize(
    raw: GeminiGenerateContentResponse,
    prepared: AdapterPreparedRequest<
      GeminiContent[],
      GeminiGenerateContentRequest
    >,
  ): Promise<AdapterNormalizedResponse> {
    const candidate = raw.candidates?.[0];
    const content = candidate?.content;

    // 解析模型返回内容（允许未返回图片，仅返回文字）
    const assistantRecord = GeminiImageAdapter.parseGeminiParts(content?.parts);
    const resolvedRole = GeminiImageAdapter.mapGeminiRoleToMessage(
      content?.role,
    );
    const assistantContentRaw = assistantRecord.content?.trim() ?? '';
    const assistantImages = Array.from(
      new Set(
        assistantRecord.images
          .map((url) => url?.trim())
          .filter((url): url is string => !!url?.length),
      ),
    );
    const finalText =
      assistantContentRaw ||
      (assistantImages.length === 0 ? '模型未返回有效内容' : '');

    // 仅保留必要的 token 统计信息，并统一成指定字段名
    const usage = raw.usageMetadata;
    const compactMetadata = Object.fromEntries(
      Object.entries({
        promptTokens: usage?.promptTokenCount,
        completionTokens: usage?.candidatesTokenCount,
        totalTokens: usage?.totalTokenCount,
      }).filter(([, v]) => v !== undefined),
    );

    const assistantPayload: ChatAdapterAssistantRecord & { model: string } = {
      content: finalText || undefined,
      images: assistantImages,
      model: prepared.model,
      role: resolvedRole,
      metadata: compactMetadata,
    };

    return {
      assistantRecord: assistantPayload,
      response: {
        content: finalText || undefined,
        images: assistantImages,
        metadata: assistantPayload.metadata,
      },
    };
  }

  private async buildConversationContext(
    history: MessageDocument[],
  ): Promise<GeminiContent[]> {
    if (!history.length) {
      return [];
    }

    const chronological = [...history].reverse();
    const contents: GeminiContent[] = [];

    for (const message of chronological) {
      const parts = await this.normalizeStoredMessage(message);
      if (!parts.length) {
        continue;
      }

      contents.push({
        role: GeminiImageAdapter.mapMessageRoleToGemini(message.role),
        parts,
      });
    }

    return contents;
  }

  private async normalizeStoredMessage(
    message: MessageDocument,
  ): Promise<GeminiPart[]> {
    const payload = GeminiImageAdapter.resolveStoredPayload(message);
    if (!GeminiImageAdapter.hasPayloadContent(payload)) {
      return [];
    }

    const parts: GeminiPart[] = [];

    if (payload.text) {
      parts.push({ text: payload.text });
    }

    for (const image of payload.images) {
      try {
        const { base64, mimeType } = await this.ensureInlineDataBase64(image);
        parts.push({
          inlineData: {
            mimeType,
            data: base64,
          },
        });
      } catch {
        continue;
      }
    }

    return parts;
  }

  private async ensureInlineDataBase64(
    inlineData: GeminiInlineData,
  ): Promise<{ base64: string; mimeType: string }> {
    const fallbackMime = 'image/png';
    if (inlineData.data && inlineData.data.trim()) {
      return {
        base64: GeminiImageAdapter.stripBase64Prefix(inlineData.data),
        mimeType: inlineData.mimeType?.trim() || fallbackMime,
      };
    }

    if (inlineData.url) {
      const downloaded = await this.downloadImageAsBase64(inlineData.url);
      const mimeType =
        downloaded.mimeType?.trim() ||
        inlineData.mimeType?.trim() ||
        fallbackMime;
      return { base64: downloaded.base64, mimeType };
    }

    throw new InternalServerErrorException('图片数据缺失');
  }

  private async downloadImageAsBase64(
    url: string,
  ): Promise<{ base64: string; mimeType?: string }> {
    try {
      const response = await axios.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer',
      });
      const base64 = Buffer.from(response.data).toString('base64');
      const mimeType = response.headers['content-type'];
      return { base64, mimeType };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`下载图片失败: ${url} - ${message}`);
      throw new InternalServerErrorException('图片下载失败');
    }
  }

  private async saveBase64Image(
    base64: string,
    mimeType?: string,
  ): Promise<{ path: string; url: string; filename: string }> {
    const normalized = GeminiImageAdapter.stripBase64Prefix(base64);
    const buffer = Buffer.from(normalized, 'base64');

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateFolder = `${year}${month}${day}`;
    const uploadDir = `uploads/${dateFolder}`;

    if (!fs.existsSync(uploadDir)) {
      await fs.promises.mkdir(uploadDir, { recursive: true });
    }

    const effectiveMime = mimeType?.trim() || 'image/png';
    const extension = GeminiImageAdapter.resolveExtension(effectiveMime);
    const filename = `${uuidv4()}.${extension}`;
    const filePath = path.join(uploadDir, filename);

    await fs.promises.writeFile(filePath, buffer);

    const baseUrl = this.configService.get<string>('app.baseUrl');
    const relativePath = filePath.replace(/\\/g, '/');

    return {
      path: filePath,
      url: `${baseUrl}/${relativePath}`,
      filename,
    };
  }

  private async enrichResponseWithImageUrls(
    response: GeminiGenerateContentResponse,
  ): Promise<void> {
    const candidates = response.candidates || [];
    for (const candidate of candidates) {
      const parts = candidate.content?.parts;
      if (!parts?.length) continue;

      for (const part of parts) {
        const inline = part.inlineData;
        if (!inline) continue;

        if (!inline.data || inline.url) {
          if (inline.url) {
            part.inlineData = { url: inline.url };
          } else {
            part.inlineData = inline;
          }
          continue;
        }

        const saved = await this.saveBase64Image(inline.data, inline.mimeType);
        part.inlineData = {
          url: saved.url,
        };
      }
    }
  }

  private async prepareUserMessage(
    dto: AiChatRequestDto,
  ): Promise<{ parts: GeminiPart[]; record: ChatAdapterUserRecord }> {
    const parts: GeminiPart[] = [];
    const trimmedContent = dto.content?.trim() ?? '';
    const uniqueImages = Array.from(
      new Set(
        (dto.images ?? [])
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter((item) => item.length > 0),
      ),
    );

    if (trimmedContent) {
      parts.push({ text: trimmedContent });
    }

    for (const url of uniqueImages) {
      const { base64, mimeType } = await this.ensureInlineDataBase64({ url });
      parts.push({
        inlineData: {
          mimeType,
          data: base64,
        },
      });
    }

    return {
      parts,
      record: {
        content: trimmedContent,
        images: uniqueImages,
        model: dto.model,
      },
    };
  }

  static parseGeminiParts(parts: GeminiPart[] | undefined) {
    if (!parts?.length) {
      return { images: [] };
    }

    const textPieces: string[] = [];
    const images: string[] = [];

    for (const part of parts) {
      const text = part.text?.trim();
      if (text) {
        textPieces.push(text);
      }

      const inline = part.inlineData;
      if (!inline) {
        continue;
      }

      if (inline.url) {
        images.push(inline.url);
        continue;
      }
    }

    return {
      content: textPieces.length ? textPieces.join('\n') : undefined,
      images,
    };
  }

  private static resolveStoredPayload(message: MessageDocument) {
    const sources: { url?: string; data?: string; mimeType?: string }[] = [];

    if (Array.isArray(message.images)) {
      for (const item of message.images) {
        if (typeof item === 'string') {
          const trimmed = item.trim();
          if (trimmed.length > 0) {
            sources.push({ url: trimmed });
          }
        }
      }
    }

    const raw = message.content as unknown;
    let text: string | undefined;

    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed) {
        text = trimmed;
      }
    }

    return {
      text,
      images: sources,
    };
  }

  private static hasPayloadContent(payload: {
    text?: string;
    images: { url?: string; data?: string; mimeType?: string }[];
  }): boolean {
    return (
      (payload.text && payload.text.trim().length > 0) ||
      payload.images.length > 0
    );
  }

  private static mapMessageRoleToGemini(role: MessageRole) {
    switch (role) {
      case MessageRole.ASSISTANT:
        return 'model';
      case MessageRole.SYSTEM:
        return 'system';
      default:
        return 'user';
    }
  }

  private static mapGeminiRoleToMessage(role?: GeminiRole): MessageRole {
    switch (role) {
      case 'system':
        return MessageRole.SYSTEM;
      case 'user':
        return MessageRole.USER;
      default:
        return MessageRole.ASSISTANT;
    }
  }

  private static stripBase64Prefix(data: string) {
    const trimmed = data.trim();
    const commaIndex = trimmed.indexOf(',');
    if (commaIndex !== -1) {
      return trimmed.slice(commaIndex + 1);
    }
    return trimmed;
  }

  private static resolveExtension(mimeType: string) {
    const mapping: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
    };
    if (mapping[mimeType]) return mapping[mimeType];
    const suffix = mimeType.split('/')[1] || 'png';
    if (suffix.includes('jpeg')) return 'jpg';
    return suffix;
  }

  private handleRequestError(error: unknown): never {
    if (error instanceof AxiosError) {
      const message = error.response?.data || error.message || error;
      this.logger.error(`调用 Gemini 失败: ${JSON.stringify(message)}`);
      throw new InternalServerErrorException(
        `AI 服务调用失败 - ${JSON.stringify(message)}`,
      );
    }

    if (error instanceof Error) {
      this.logger.error(`Gemini 请求失败: ${error.message}`);
      throw new InternalServerErrorException('AI 服务调用失败');
    }

    this.logger.error(`Gemini 请求失败: ${JSON.stringify(error)}`);
    throw new InternalServerErrorException('AI 服务调用失败');
  }
}
