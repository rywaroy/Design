import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AiChatRequestDto, AiChatResponseDto } from './dto/ai-chat.dto';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @ApiOperation({
    summary: 'AI 对话（支持图片）',
    description:
      '转发文本与可选图片 Base64 至 Gemini，获取模型回复或生成图片。',
  })
  @ApiBody({ type: AiChatRequestDto })
  @ApiOkResponse({
    description: '模型回复成功',
    type: AiChatResponseDto,
  })
  async chat(@Body() dto: AiChatRequestDto): Promise<AiChatResponseDto> {
    return this.aiService.chat(dto);
  }
}
