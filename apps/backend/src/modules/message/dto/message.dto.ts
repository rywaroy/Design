import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageRole } from '../entities/message.entity';

const trimValue = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

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
  @Transform(trimValue)
  @ApiPropertyOptional({ description: '消息文本内容' })
  content?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ApiPropertyOptional({
    description: '图片 URL 列表',
    type: String,
    isArray: true,
  })
  @IsUrl(
    { require_protocol: true },
    { each: true, message: 'images 每项必须为合法 URL' },
  )
  @Type(() => String)
  images?: string[];

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
