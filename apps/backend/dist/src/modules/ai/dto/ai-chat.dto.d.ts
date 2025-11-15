export declare class AiChatRequestDto {
    sessionId: string;
    content?: string;
    images?: string[];
    model?: string;
    aspectRatio?: string;
}
export declare class AiChatResponseDto {
    content?: string;
    images: string[];
    metadata?: Record<string, unknown>;
}
