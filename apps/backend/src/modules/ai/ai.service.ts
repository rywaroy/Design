import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosInstance } from 'axios';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

type GeminiRole = 'user' | 'model' | 'system';

export interface GeminiInlineData {
  mimeType?: string;
  data?: string;
  url?: string;
}

export interface GeminiPart {
  text?: string;
  inlineData?: GeminiInlineData;
}

interface GeminiContent {
  role?: GeminiRole;
  parts: GeminiPart[];
}

export interface GeminiSafetyRating {
  category?: string;
  probability?: string;
  blocked?: boolean;
  probabilityScore?: number;
}

export interface GeminiCandidate {
  content?: GeminiContent;
  finishReason?: string;
  index?: number;
  safetyRatings?: GeminiSafetyRating[] | null;
}

interface GeminiPromptFeedback {
  blockReason?: string;
  safetyRatings?: GeminiSafetyRating[] | null;
}

interface GeminiTokenDetails {
  modality?: string;
  tokenCount?: number;
}

interface GeminiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
  promptTokensDetails?: GeminiTokenDetails[];
  candidatesTokensDetails?: GeminiTokenDetails[];
}

interface GeminiGenerationConfig {
  responseModalities?: string[];
}

interface GeminiGenerateContentRequest {
  contents: GeminiContent[];
  systemInstruction?: GeminiContent;
  generationConfig?: GeminiGenerationConfig;
}

export interface GeminiGenerateContentResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: GeminiPromptFeedback;
  usageMetadata?: GeminiUsageMetadata;
  modelVersion?: string;
  responseId?: string;
}

export interface AiPromptParams {
  userPrompt: string;
  systemInstruction?: string;
}

export interface AiContentParams {
  parts: GeminiPart[];
  model?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly httpClient: AxiosInstance;
  private readonly model: string;
  private readonly imageModel: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    const baseUrl =
      this.configService.get<string>('ai.baseUrl') ||
      'https://generativelanguage.googleapis.com';
    const timeout = this.configService.get<number>('ai.timeoutMs') || 20000;

    this.apiKey = this.configService.get<string>('ai.apiKey') || '';
    this.model =
      this.configService.get<string>('ai.model') || 'gemini-1.5-flash';
    this.imageModel =
      this.configService.get<string>('ai.imageModel') ||
      'models/gemini-2.5-flash-image';

    this.httpClient = axios.create({
      baseURL: baseUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async generateJsonResponse<T>(params: AiPromptParams): Promise<T> {
    // 强制要求模型仅返回 JSON 文本，避免额外说明或包裹
    const jsonOnlyInstruction =
      '请严格输出合法的 JSON 文本，不能包含任何解释、前后缀、或 Markdown 代码块标记（如 ```json 或 ```）。只返回 JSON 本体。';

    const mergedParams: AiPromptParams = {
      userPrompt: params.userPrompt,
      systemInstruction: params.systemInstruction
        ? `${params.systemInstruction}\n\n${jsonOnlyInstruction}`
        : jsonOnlyInstruction,
    };

    const raw = await this.generateTextResponse(mergedParams);
    try {
      const jsonText = AiService.extractJsonBlock(raw);
      return JSON.parse(jsonText) as T;
    } catch (error) {
      this.logger.error(`解析大模型返回内容失败: ${(error as Error).message}`);
      throw new InternalServerErrorException('AI 返回内容解析失败');
    }
  }

  async generateTextResponse(params: AiPromptParams): Promise<string> {
    if (!this.apiKey) {
      this.logger.error('AI_API_KEY 未配置');
      throw new InternalServerErrorException('AI 服务未正确配置');
    }

    const requestBody: GeminiGenerateContentRequest = {
      contents: [
        {
          role: 'user',
          parts: [{ text: params.userPrompt }],
        },
      ],
    };

    if (params.systemInstruction) {
      requestBody.systemInstruction = {
        role: 'system',
        parts: [{ text: params.systemInstruction }],
      };
    }

    try {
      const response =
        await this.httpClient.post<GeminiGenerateContentResponse>(
          `/v1beta/models/${this.model}:generateContent`,
          requestBody,
          {
            params: { key: this.apiKey },
          },
        );
      const candidate = response.data.candidates?.[0];
      const trimmed = AiService.extractTextFromParts(candidate?.content?.parts);

      if (!trimmed) {
        this.logger.error(
          `AI 服务未返回任何文本，finishReason=${candidate?.finishReason}`,
        );
        throw new InternalServerErrorException('AI 服务返回为空');
      }

      return trimmed;
    } catch (error) {
      const axiosError = error as AxiosError;
      const message = axiosError.response?.data || axiosError.message || error;
      this.logger.error(`调用 AI 服务失败: ${JSON.stringify(message)}`);
      throw new InternalServerErrorException(
        `AI 服务调用失败 - ${JSON.stringify(message)}`,
      );
    }
  }

  async generateImageContent(
    params: AiContentParams,
  ): Promise<GeminiGenerateContentResponse> {
    if (!this.apiKey) {
      this.logger.error('AI_API_KEY 未配置');
      throw new InternalServerErrorException('AI 服务未正确配置');
    }

    const preparedParts: GeminiPart[] = [];
    for (const part of params.parts) {
      const prepared: GeminiPart = {};
      if (part.text) {
        prepared.text = part.text;
      }

      const inlineSource = part.inlineData;
      if (inlineSource) {
        const { base64, mimeType } =
          await this.ensureInlineDataBase64(inlineSource);

        prepared.inlineData = {
          mimeType,
          data: base64,
        };
      }

      preparedParts.push(prepared);
    }

    const requestBody: GeminiGenerateContentRequest = {
      contents: [
        {
          role: 'user',
          parts: preparedParts,
        },
      ],
      generationConfig: {
        responseModalities: ['Image'],
      },
    };

    const targetModel = params.model || this.imageModel;

    try {
      const response =
        await this.httpClient.post<GeminiGenerateContentResponse>(
          `/v1beta/models/${targetModel}:generateContent`,
          requestBody,
          {
            params: { key: this.apiKey },
          },
        );

      await this.enrichResponseWithImageUrls(response.data);

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const message = axiosError.response?.data || axiosError.message || error;
      this.logger.error(`调用 AI 服务失败: ${JSON.stringify(message)}`);
      throw new InternalServerErrorException(
        `AI 服务调用失败 - ${JSON.stringify(message)}`,
      );
    }
  }

  private static extractJsonBlock(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) throw new Error('返回内容为空');

    // 1) 纯 JSON 文本
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return trimmed;

    // 2) Markdown 代码块 ```json ... ``` 或 ``` ... ```
    if (trimmed.startsWith('```')) {
      const withoutFirstFence = trimmed.slice(3); // 跳过开头的 ```
      const firstNewline = withoutFirstFence.indexOf('\n');
      if (firstNewline === -1) throw new Error('代码块不完整');

      // 可能存在的语言标识（如 json、JSON 等），忽略它
      const rest = withoutFirstFence.slice(firstNewline + 1);
      const endFence = rest.lastIndexOf('```');
      if (endFence === -1) throw new Error('未找到代码块结束标记');

      const code = rest.slice(0, endFence).trim();
      if (!code) throw new Error('代码块为空');
      return code;
    }

    throw new Error('未找到 JSON 或 markdown 代码块');
  }

  private static extractTextFromParts(parts?: GeminiPart[]): string {
    if (!parts?.length) return '';

    const text = parts
      .map((part) => part.text?.trim() || '')
      .filter((segment) => segment.length > 0)
      .join('\n')
      .trim();

    return text;
  }

  private async ensureInlineDataBase64(
    inlineData: GeminiInlineData,
  ): Promise<{ base64: string; mimeType: string }> {
    const fallbackMime = 'image/png';
    if (inlineData.data && inlineData.data.trim()) {
      return {
        base64: AiService.stripBase64Prefix(inlineData.data),
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

  private static stripBase64Prefix(data: string): string {
    const trimmed = data.trim();
    const commaIndex = trimmed.indexOf(',');
    if (commaIndex !== -1) {
      return trimmed.slice(commaIndex + 1);
    }
    return trimmed;
  }

  private static resolveExtension(mimeType: string): string {
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

  private async saveBase64Image(
    base64: string,
    mimeType?: string,
  ): Promise<{ path: string; url: string; filename: string }> {
    const normalized = AiService.stripBase64Prefix(base64);
    const buffer = Buffer.from(normalized, 'base64');

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateFolder = `${year}${month}${day}`;
    const uploadDir = path.join('uploads', dateFolder);

    if (!fs.existsSync(uploadDir)) {
      await fsPromises.mkdir(uploadDir, { recursive: true });
    }

    const effectiveMime = mimeType?.trim() || 'image/png';
    const extension = AiService.resolveExtension(effectiveMime);
    const filename = `${uuidv4()}.${extension}`;
    const filePath = path.join(uploadDir, filename);

    await fsPromises.writeFile(filePath, buffer);

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
}
