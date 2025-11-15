import { ConfigService } from '@nestjs/config';
import { AiChatRequestDto, AiChatResponseDto } from './dto/ai-chat.dto';
import { MessageService } from '../message/message.service';
import { GeminiPart } from './providers/gemini.types';
import { GeminiImageAdapter } from './adapters/gemini-image.adapter';
import { ModelService } from '../model/model.service';
export interface AiPromptParams {
    userPrompt: string;
    systemInstruction?: string;
}
export interface AiContentParams {
    parts: GeminiPart[];
    model?: string;
}
export declare class AiService {
    private readonly configService;
    private readonly messageService;
    private readonly geminiAdapter;
    private readonly modelService;
    private readonly logger;
    private readonly httpClient;
    private readonly model;
    private readonly apiKey;
    private readonly adapters;
    private readonly chatHistoryLimit;
    constructor(configService: ConfigService, messageService: MessageService, geminiAdapter: GeminiImageAdapter, modelService: ModelService);
    generateJsonResponse<T>(params: AiPromptParams): Promise<T>;
    generateTextResponse(params: AiPromptParams): Promise<string>;
    chat(dto: AiChatRequestDto): Promise<AiChatResponseDto>;
    private handleAdapterError;
    private static extractJsonBlock;
    private static extractTextFromParts;
}
