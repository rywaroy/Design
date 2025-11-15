import { ConfigService } from '@nestjs/config';
import { AiChatRequestDto } from '../dto/ai-chat.dto';
import { GeminiContent, GeminiGenerateContentRequest, GeminiGenerateContentResponse, GeminiPart } from '../providers/gemini.types';
import { AdapterNormalizedResponse, AdapterPreparedRequest, AiChatAdapter } from './chat-adapter.interface';
import { MessageDocument } from '../../message/entities/message.entity';
export declare class GeminiImageAdapter implements AiChatAdapter<GeminiContent[], GeminiGenerateContentRequest, GeminiGenerateContentResponse> {
    private readonly configService;
    readonly name = "Gemini Image";
    private readonly logger;
    constructor(configService: ConfigService);
    private buildHttpClient;
    private resolveApiKey;
    private get imageModel();
    prepare(dto: AiChatRequestDto, history: MessageDocument[]): Promise<AdapterPreparedRequest<GeminiContent[], GeminiGenerateContentRequest>>;
    send(prepared: AdapterPreparedRequest<GeminiContent[], GeminiGenerateContentRequest>): Promise<GeminiGenerateContentResponse>;
    normalize(raw: GeminiGenerateContentResponse, prepared: AdapterPreparedRequest<GeminiContent[], GeminiGenerateContentRequest>): Promise<AdapterNormalizedResponse>;
    private buildConversationContext;
    private normalizeStoredMessage;
    private ensureInlineDataBase64;
    private downloadImageAsBase64;
    private saveBase64Image;
    private enrichResponseWithImageUrls;
    private prepareUserMessage;
    static parseGeminiParts(parts: GeminiPart[] | undefined): {
        images: any[];
        content?: undefined;
    } | {
        content: string;
        images: string[];
    };
    private static resolveStoredPayload;
    private static hasPayloadContent;
    private static mapMessageRoleToGemini;
    private static mapGeminiRoleToMessage;
    private static stripBase64Prefix;
    private static resolveExtension;
    private handleRequestError;
}
