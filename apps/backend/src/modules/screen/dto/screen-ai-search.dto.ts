import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ScreenSearchResultDto } from './screen-search-result.dto';

const trimValue = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ScreenAiSearchRequestDto {
  @ApiProperty({ description: '用户提供的需求描述' })
  @Transform(trimValue)
  @IsString()
  @MinLength(2)
  requirement: string;

  @ApiPropertyOptional({ description: '当前页码', default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 10;

  @ApiPropertyOptional({ description: '项目 ID' })
  @Transform(trimValue)
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: '平台', enum: ['ios', 'web'] })
  @Transform(trimValue)
  @IsOptional()
  @IsString()
  platform?: string;
}

export class ScreenAiDimensionSelectionDto {
  @ApiProperty({ description: '一级标签（大类）', type: [String] })
  firstLevel: string[] = [];

  @ApiProperty({ description: '二级标签', type: [String] })
  secondLevel: string[] = [];

  @ApiPropertyOptional({
    description: '一级标签到二级标签的映射',
    type: Object,
  })
  mapping: Record<string, string[]> = {};
}

export class ScreenAiDimensionIntentDto {
  @ApiProperty({ description: '是否提及该维度' })
  relevant: boolean;

  @ApiPropertyOptional({ description: '模型给出的判断原因' })
  reason?: string;

  @ApiPropertyOptional({ description: '模型置信度，0-1 之间的小数' })
  confidence?: number;
}

export class ScreenAiTagsDto {
  @ApiProperty({
    description: '应用类别标签选择',
    type: ScreenAiDimensionSelectionDto,
  })
  appCategory = new ScreenAiDimensionSelectionDto();

  @ApiProperty({
    description: '组件索引标签选择',
    type: ScreenAiDimensionSelectionDto,
  })
  componentIndex = new ScreenAiDimensionSelectionDto();

  @ApiProperty({
    description: '页面布局标签选择',
    type: ScreenAiDimensionSelectionDto,
  })
  layoutType = new ScreenAiDimensionSelectionDto();

  @ApiProperty({
    description: '页面类型标签选择',
    type: ScreenAiDimensionSelectionDto,
  })
  pageType = new ScreenAiDimensionSelectionDto();

  @ApiProperty({
    description: '核心功能标签选择',
    type: ScreenAiDimensionSelectionDto,
  })
  tagsPrimary = new ScreenAiDimensionSelectionDto();

  @ApiProperty({
    description: '视觉风格标签选择',
    type: ScreenAiDimensionSelectionDto,
  })
  tagsStyle = new ScreenAiDimensionSelectionDto();

  @ApiProperty({
    description: '组件标签选择',
    type: ScreenAiDimensionSelectionDto,
  })
  tagsComponents = new ScreenAiDimensionSelectionDto();
}

export class ScreenAiMetaDto {
  @ApiProperty({
    description: '维度意图识别结果',
    type: () => ScreenAiDimensionIntentDto,
    isArray: false,
  })
  intent: Record<string, ScreenAiDimensionIntentDto> = {};

  @ApiPropertyOptional({ description: '模型返回的提示信息' })
  notice?: string;

  @ApiPropertyOptional({
    description: '原始模型回复片段，用于调试',
    type: [String],
  })
  rawResponses?: string[];
}

export class ScreenAiSearchResponseDto {
  @ApiProperty({
    description: 'AI 解析后的标签结果',
    type: ScreenAiTagsDto,
  })
  tags: ScreenAiTagsDto;

  @ApiProperty({
    description: '模型诊断信息与提示',
    type: ScreenAiMetaDto,
  })
  llmMeta: ScreenAiMetaDto;

  @ApiProperty({
    description: '基于标签的模糊搜索结果',
    type: () => PaginationDto,
  })
  search: PaginationDto<ScreenSearchResultDto>;
}
