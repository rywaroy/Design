import {
  Body,
  Controller,
  InternalServerErrorException,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiService, GeminiPart } from './ai.service';
import {
  AiChatRequestDto,
  AiChatCandidateContentDto,
  AiChatResponsePartDto,
} from './dto/ai-chat.dto';

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
    type: AiChatCandidateContentDto,
  })
  async chat(
    @Body() dto: AiChatRequestDto,
  ): Promise<AiChatCandidateContentDto> {
    const parts = dto.parts.map<GeminiPart>((part) => {
      const geminiPart: GeminiPart = {};

      if (part.text) {
        geminiPart.text = part.text;
      }
      if (part.inlineData) {
        geminiPart.inlineData = {
          mimeType: part.inlineData.mimeType,
          data: part.inlineData.data,
          url: part.inlineData.url,
        };
      }

      return geminiPart;
    });

    const result = await this.aiService.generateImageContent({
      parts,
      model: dto.model,
    });

    const candidate = result.candidates?.[0];
    const content = candidate?.content;

    if (!content) {
      throw new InternalServerErrorException('模型未返回内容');
    }

    return content;
  }
}
