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
import { Project } from '../entities/project.entity';

const trimValue = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ProjectAiSearchRequestDto {
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

  @ApiPropertyOptional({ description: '限定平台，可选 ios 或 web' })
  @Transform(trimValue)
  @IsOptional()
  @IsString()
  platform?: string;
}

export class ProjectAiDimensionSelectionDto {
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

export class ProjectAiDimensionIntentDto {
  @ApiProperty({ description: '是否提及该维度' })
  relevant: boolean;

  @ApiPropertyOptional({ description: '模型给出的判断原因' })
  reason?: string;

  @ApiPropertyOptional({ description: '模型置信度，0-1 之间的小数' })
  confidence?: number;
}

export class ProjectAiTagsDto {
  @ApiProperty({
    description: '应用类型标签选择',
    type: ProjectAiDimensionSelectionDto,
  })
  applicationType = new ProjectAiDimensionSelectionDto();

  @ApiProperty({
    description: '行业领域标签选择',
    type: ProjectAiDimensionSelectionDto,
  })
  industrySector = new ProjectAiDimensionSelectionDto();
}

export class ProjectAiMetaDto {
  @ApiProperty({
    description: '维度意图识别结果',
    type: () => ProjectAiDimensionIntentDto,
    isArray: false,
  })
  intent: Record<string, ProjectAiDimensionIntentDto> = {};

  @ApiPropertyOptional({ description: '模型返回的提示信息' })
  notice?: string;

  @ApiPropertyOptional({
    description: '原始模型回复片段，用于调试',
    type: [String],
  })
  rawResponses?: string[];
}

export class ProjectAiSearchResponseDto {
  @ApiProperty({
    description: 'AI 解析后的标签结果',
    type: ProjectAiTagsDto,
  })
  tags: ProjectAiTagsDto;

  @ApiProperty({
    description: '模型诊断信息与提示',
    type: ProjectAiMetaDto,
  })
  llmMeta: ProjectAiMetaDto;

  @ApiProperty({
    description: '基于标签的项目搜索结果',
    type: () => PaginationDto,
  })
  search: PaginationDto<Project>;
}
