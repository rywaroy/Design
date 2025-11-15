import { AiService } from './ai.service';
import { AiChatRequestDto, AiChatResponseDto } from './dto/ai-chat.dto';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    chat(dto: AiChatRequestDto): Promise<AiChatResponseDto>;
}
