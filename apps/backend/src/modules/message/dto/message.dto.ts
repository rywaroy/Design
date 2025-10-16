import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageRole } from '../entities/message.entity';

export class MessageInlineDataDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: '资源类型，例如 image/png' })
  mimeType?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Base64 数据，或模型返回的数据字符串' })
  data?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: '可直接访问的资源 URL' })
  url?: string;
}

export class MessagePartDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: '文本内容' })
  text?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MessageInlineDataDto)
  @ApiPropertyOptional({ description: '图像或文件数据' })
  inlineData?: MessageInlineDataDto;
}

export class CreateMessageDto {
  @IsMongoId()
  @ApiProperty({ description: '所属会话 ID' })
  sessionId: string;

  @IsEnum(MessageRole)
  @ApiProperty({
    description: '消息角色',
    enum: MessageRole,
    default: MessageRole.USER,
  })
  role: MessageRole;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: '纯文本或序列化后的 JSON 内容' })
  content?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => MessagePartDto)
  @ApiPropertyOptional({
    description: '结构化内容片段，将被序列化后存入 content 字段',
    type: [MessagePartDto],
  })
  parts?: MessagePartDto[];

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: '使用的模型名称' })
  model?: string;

  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({ description: '额外的模型响应元数据' })
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: '自定义消息时间，缺省使用当前时间' })
  createdAt?: string;
}

export class ListMessageQueryDto {
  @IsMongoId()
  @ApiProperty({ description: '会话 ID' })
  sessionId: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(200)
  @ApiPropertyOptional({ description: '返回条数，默认 50，最大 200' })
  limit?: number;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: '仅返回该时间之前的消息，用于分页' })
  before?: string;
}
