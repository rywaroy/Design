import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsBase64,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MinLength,
  ValidateIf,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
} from 'class-validator';

const trimValue = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

@ValidatorConstraint({ name: 'aiChatInlineDataContent', async: false })
export class AiChatInlineDataContentConstraint
  implements ValidatorConstraintInterface
{
  validate(_: unknown, args: ValidationArguments) {
    const value = args.object as AiChatInlineDataDto;
    const hasData =
      typeof value.data === 'string' && value.data.trim().length > 0;
    const hasUrl = typeof value.url === 'string' && value.url.trim().length > 0;
    return hasData || hasUrl;
  }

  defaultMessage() {
    return '图片内容需要提供 data 或 url 至少一个字段';
  }
}

export class AiChatInlineDataDto {
  @ApiProperty({ description: '图片的 MIME 类型，如 image/png' })
  @Transform(trimValue)
  @IsString()
  @Matches(/^image\//, { message: 'mimeType 必须是合法的图片类型' })
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Base64 编码的图片数据' })
  @Transform(trimValue)
  @ValidateIf((o) => typeof o.data === 'string')
  @IsString()
  @IsBase64()
  data?: string;

  @ApiPropertyOptional({ description: '图片资源的可访问 URL' })
  @Transform(trimValue)
  @ValidateIf((o) => typeof o.url === 'string')
  @IsString()
  @IsUrl({ require_protocol: true }, { message: 'url 必须为合法的绝对地址' })
  url?: string;

  @Validate(AiChatInlineDataContentConstraint)
  private readonly contentGuard?: unknown;
}

@ValidatorConstraint({ name: 'aiChatPartContent', async: false })
export class AiChatPartContentConstraint
  implements ValidatorConstraintInterface
{
  validate(_: unknown, args: ValidationArguments) {
    const part = args.object as AiChatPartDto;
    const hasText =
      typeof part.text === 'string' && part.text.trim().length > 0;
    const inline = part.inlineData;
    const hasImage =
      !!inline?.mimeType &&
      ((typeof inline.data === 'string' && inline.data.trim().length > 0) ||
        (typeof inline.url === 'string' && inline.url.trim().length > 0));
    return hasText || hasImage;
  }

  defaultMessage() {
    return '每个消息片段至少需要提供文本或图片数据';
  }
}

export class AiChatPartDto {
  @ApiPropertyOptional({ description: '文本内容' })
  @Transform(trimValue)
  @IsOptional()
  @IsString()
  @MinLength(1)
  text?: string;

  @ApiPropertyOptional({
    description: '图片内容（Base64）',
    type: AiChatInlineDataDto,
  })
  @ValidateNested()
  @IsOptional()
  @Type(() => AiChatInlineDataDto)
  inlineData?: AiChatInlineDataDto;

  @Validate(AiChatPartContentConstraint)
  private readonly contentGuard?: unknown;
}

export class AiChatRequestDto {
  @ApiProperty({
    description: '用户请求的消息片段列表，顺序即发送顺序',
    type: AiChatPartDto,
    isArray: true,
  })
  @ValidateNested({ each: true })
  @Type(() => AiChatPartDto)
  @ArrayMinSize(1)
  parts!: AiChatPartDto[];

  @ApiPropertyOptional({ description: '可选的模型 ID' })
  @Transform(trimValue)
  @IsOptional()
  @IsString()
  @MinLength(1)
  model?: string;
}

export class AiChatResponsePartDto {
  @ApiPropertyOptional({ description: '模型回复的文本片段' })
  text?: string;

  @ApiPropertyOptional({
    description: '模型回复的图片内容',
    type: AiChatInlineDataDto,
  })
  inlineData?: AiChatInlineDataDto;
}

export class AiChatSafetyRatingDto {
  @ApiPropertyOptional({ description: '安全分类' })
  category?: string;

  @ApiPropertyOptional({ description: '安全概率标签' })
  probability?: string;

  @ApiPropertyOptional({ description: '是否被拦截' })
  blocked?: boolean;

  @ApiPropertyOptional({ description: '概率分数' })
  probabilityScore?: number;
}

export class AiChatPromptFeedbackDto {
  @ApiPropertyOptional({ description: '拦截原因' })
  blockReason?: string;

  @ApiPropertyOptional({ description: '安全评级' })
  safetyRatings?: AiChatSafetyRatingDto[] | null;
}

export class AiChatUsageTokenDetailDto {
  @ApiPropertyOptional({ description: '模态类型' })
  modality?: string;

  @ApiPropertyOptional({ description: 'token 数量' })
  tokenCount?: number;
}

export class AiChatUsageMetadataDto {
  @ApiPropertyOptional({ description: '提示词 token 数' })
  promptTokenCount?: number;

  @ApiPropertyOptional({ description: '候选 token 数' })
  candidatesTokenCount?: number;

  @ApiPropertyOptional({ description: '总 token 数' })
  totalTokenCount?: number;

  @ApiPropertyOptional({
    description: '提示词模态 token 明细',
    type: AiChatUsageTokenDetailDto,
    isArray: true,
  })
  promptTokensDetails?: AiChatUsageTokenDetailDto[];

  @ApiPropertyOptional({
    description: '候选模态 token 明细',
    type: AiChatUsageTokenDetailDto,
    isArray: true,
  })
  candidatesTokensDetails?: AiChatUsageTokenDetailDto[];
}

export class AiChatCandidateContentDto {
  @ApiPropertyOptional({ description: '消息角色' })
  role?: string;

  @ApiProperty({
    description: '消息片段列表',
    type: AiChatResponsePartDto,
    isArray: true,
  })
  parts: AiChatResponsePartDto[] = [];
}

export class AiChatCandidateDto {
  @ApiPropertyOptional({
    description: '候选内容',
    type: AiChatCandidateContentDto,
  })
  content?: AiChatCandidateContentDto;

  @ApiPropertyOptional({ description: '结束原因' })
  finishReason?: string;

  @ApiPropertyOptional({ description: '候选索引' })
  index?: number;

  @ApiPropertyOptional({
    description: '安全评级',
    type: AiChatSafetyRatingDto,
    isArray: true,
  })
  safetyRatings?: AiChatSafetyRatingDto[] | null;
}

export class AiChatResponseDto {
  @ApiPropertyOptional({
    description: '模型候选列表',
    type: AiChatCandidateDto,
    isArray: true,
  })
  candidates?: AiChatCandidateDto[];

  @ApiPropertyOptional({
    description: '提示词反馈',
    type: AiChatPromptFeedbackDto,
  })
  promptFeedback?: AiChatPromptFeedbackDto;

  @ApiPropertyOptional({
    description: '使用统计',
    type: AiChatUsageMetadataDto,
  })
  usageMetadata?: AiChatUsageMetadataDto;

  @ApiPropertyOptional({ description: '模型版本' })
  modelVersion?: string;

  @ApiPropertyOptional({ description: '响应 ID' })
  responseId?: string;
}
