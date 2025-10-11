import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { AiService } from './ai.service';

describe('AiService', () => {
  let axiosCreateSpy: jest.SpyInstance;

  const setupService = (
    overrides?: Partial<Record<string, string | number | undefined>>,
  ) => {
    const mockPost = jest.fn();
    axiosCreateSpy.mockReturnValue({
      post: mockPost,
    });

    const defaults: Record<string, string | number | undefined> = {
      'ai.baseUrl': 'https://example.com',
      'ai.timeoutMs': 5000,
      'ai.apiKey': 'mock-api-key',
      'ai.model': 'models/mock',
    };

    const configMap = { ...defaults, ...overrides };
    const configService = {
      get: jest.fn((key: string) => configMap[key]),
    } as unknown as ConfigService;

    return {
      service: new AiService(configService),
      mockPost,
    };
  };

  beforeAll(() => {
    axiosCreateSpy = jest.spyOn(axios, 'create');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    axiosCreateSpy.mockReset();
  });

  afterAll(() => {
    axiosCreateSpy.mockRestore();
  });

  it('should throw when API key is missing', async () => {
    const { service } = setupService({ 'ai.apiKey': '' });
    await expect(
      service.generateTextResponse({ userPrompt: 'hello' }),
    ).rejects.toThrow('AI 服务未正确配置');
  });

  it('should call Gemini API and return trimmed text', async () => {
    const { service, mockPost } = setupService();
    mockPost.mockResolvedValue({
      data: {
        candidates: [
          {
            content: {
              parts: [{ text: '  mock answer  ' }],
            },
            finishReason: 'STOP',
          },
        ],
      },
    });

    const result = await service.generateTextResponse({
      userPrompt: 'describe mock',
      systemInstruction: 'be concise',
    });

    expect(result).toBe('mock answer');
    expect(mockPost).toHaveBeenCalledWith(
      '/v1beta/models/models/mock:generateContent',
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: 'describe mock' }],
          },
        ],
        systemInstruction: {
          role: 'system',
          parts: [{ text: 'be concise' }],
        },
      },
      { params: { key: 'mock-api-key' } },
    );
  });

  it('should parse JSON block from generateJsonResponse', async () => {
    const { service, mockPost } = setupService();
    mockPost.mockResolvedValue({
      data: {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '```json\n{"foo":"bar","count":1}\n```',
                },
              ],
            },
          },
        ],
      },
    });

    const response = await service.generateJsonResponse<{
      foo: string;
      count: number;
    }>({ userPrompt: 'return json' });

    expect(response).toEqual({ foo: 'bar', count: 1 });
  });

  it('should throw when AI returns non-parsable JSON', async () => {
    const { service, mockPost } = setupService();
    mockPost.mockResolvedValue({
      data: {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '没有 JSON 结构',
                },
              ],
            },
          },
        ],
      },
    });

    await expect(
      service.generateJsonResponse<{ ok: boolean }>({
        userPrompt: 'return json',
      }),
    ).rejects.toThrow('AI 返回内容解析失败');
  });

  it('should wrap Axios errors into InternalServerErrorException', async () => {
    const { service, mockPost } = setupService();
    const axiosError = new AxiosError('network failed');
    axiosError.response = {
      data: { error: 'upstream error' },
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: { headers: {} as any } as any,
    };
    mockPost.mockRejectedValue(axiosError);

    await expect(
      service.generateTextResponse({ userPrompt: 'foo' }),
    ).rejects.toThrow('AI 服务调用失败');
  });
});
