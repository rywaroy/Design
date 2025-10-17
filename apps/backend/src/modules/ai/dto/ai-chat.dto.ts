import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const trimValue = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class AiChatRequestDto {
  @ApiProperty({ description: '会话 ID' })
  @Transform(trimValue)
  @IsMongoId()
  sessionId!: string;

  @ApiPropertyOptional({ description: '用户输入的文本内容' })
  @Transform(trimValue)
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  content?: string;

  @ApiPropertyOptional({
    description: '用户上传的图片 URL 列表',
    type: String,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @Type(() => String)
  images?: string[];

  @ApiPropertyOptional({ description: '指定使用的模型' })
  @Transform(trimValue)
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: '图片生成比例，例如 1:1、16:9、9:16；默认 1:1' })
  @Transform(trimValue)
  @IsOptional()
  @IsString()
  aspectRatio?: string;
}

export class AiChatResponseDto {
  @ApiPropertyOptional({ description: '模型回复的文本内容' })
  content?: string;

  @ApiProperty({
    description: '模型回复的图片 URL 列表',
    type: String,
    isArray: true,
  })
  images: string[] = [];

  @ApiPropertyOptional({
    description: '模型返回的额外元信息，例如安全评级等',
    type: Object,
  })
  metadata?: Record<string, unknown>;
}
