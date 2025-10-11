import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosInstance } from 'axios';

type GeminiRole = 'user' | 'model' | 'system';

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  role?: GeminiRole;
  parts: GeminiPart[];
}

interface GeminiCandidate {
  content?: GeminiContent;
  finishReason?: string;
}

interface GeminiGenerateContentRequest {
  contents: GeminiContent[];
  systemInstruction?: GeminiContent;
}

interface GeminiGenerateContentResponse {
  candidates?: GeminiCandidate[];
}

export interface AiPromptParams {
  userPrompt: string;
  systemInstruction?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly httpClient: AxiosInstance;
  private readonly model: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    const baseUrl =
      this.configService.get<string>('ai.baseUrl') ||
      'https://generativelanguage.googleapis.com';
    const timeout = this.configService.get<number>('ai.timeoutMs') || 20000;

    this.apiKey = this.configService.get<string>('ai.apiKey') || '';
    this.model =
      this.configService.get<string>('ai.model') || 'gemini-1.5-flash';

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
      const contentText =
        candidate?.content?.parts?.map((part) => part.text).join('\n') || '';
      const trimmed = contentText.trim();

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
      throw new InternalServerErrorException('AI 服务调用失败');
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
}
