import { MessageRole } from '../entities/message.entity';
export declare class CreateMessageDto {
    sessionId: string;
    role: MessageRole;
    content?: string;
    images?: string[];
    metadata?: Record<string, unknown>;
    createdAt?: string;
}
export declare class ListMessageQueryDto {
    sessionId: string;
    limit?: number;
    before?: string;
}
