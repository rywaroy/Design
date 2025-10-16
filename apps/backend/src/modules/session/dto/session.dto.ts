import { PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SessionStatus } from '../entities/session.entity';

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: '会话标题，未提供时默认使用“新对话”' })
  title?: string;
}

export class UpdateSessionDto extends PartialType(CreateSessionDto) {
  @IsOptional()
  @IsEnum(SessionStatus)
  @ApiPropertyOptional({ description: '会话状态（active/archived）' })
  status?: SessionStatus;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: '最近一条消息内容摘要' })
  lastMessage?: string;

  @IsOptional()
  @ApiPropertyOptional({ description: '更新时间戳，用于外部同步' })
  lastMessageAt?: Date;
}

export class ListSessionQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({ description: '返回数量限制，默认 20，最大 100' })
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ description: '页码，默认 1' })
  page?: number;
}
