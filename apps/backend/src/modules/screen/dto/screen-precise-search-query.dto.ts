import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const transformToArray = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : undefined))
      .filter((item): item is string => !!item);
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return [value.trim()];
  }
  return undefined;
};

const trimValue = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ScreenPreciseSearchQueryDto {
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

  @ApiPropertyOptional({ description: '页面二级类型' })
  @Transform(trimValue)
  @IsOptional()
  @IsString()
  pageTypeL2?: string;

  @ApiPropertyOptional({ description: '应用二级分类' })
  @Transform(trimValue)
  @IsOptional()
  @IsString()
  appCategoryL2?: string;

  @ApiPropertyOptional({ description: '设计体系' })
  @Transform(trimValue)
  @IsOptional()
  @IsString()
  designSystem?: string;

  @ApiPropertyOptional({ description: '二级类型' })
  @Transform(trimValue)
  @IsOptional()
  @IsString()
  typeL2?: string;

  @ApiPropertyOptional({ description: '间距' })
  @Transform(trimValue)
  @IsOptional()
  @IsString()
  spacing?: string;

  @ApiPropertyOptional({ description: '密度' })
  @Transform(trimValue)
  @IsOptional()
  @IsString()
  density?: string;

  @ApiPropertyOptional({
    description: '组件二级索引，精确匹配所有值',
    type: [String],
  })
  @Transform(({ value }) => transformToArray(value))
  @IsOptional()
  @IsString({ each: true })
  componentIndexL2?: string[];

  @ApiPropertyOptional({
    description: '一级标签二级内容，需全部命中',
    type: [String],
  })
  @Transform(({ value }) => transformToArray(value))
  @IsOptional()
  @IsString({ each: true })
  tagsPrimaryL2?: string[];

  @ApiPropertyOptional({
    description: '样式标签二级内容，需全部命中',
    type: [String],
  })
  @Transform(({ value }) => transformToArray(value))
  @IsOptional()
  @IsString({ each: true })
  tagsStyleL2?: string[];

  @ApiPropertyOptional({
    description: '组件标签二级内容，需全部命中',
    type: [String],
  })
  @Transform(({ value }) => transformToArray(value))
  @IsOptional()
  @IsString({ each: true })
  tagsComponentsL2?: string[];

  @ApiPropertyOptional({
    description: '设计风格，需全部命中',
    type: [String],
  })
  @Transform(({ value }) => transformToArray(value))
  @IsOptional()
  @IsString({ each: true })
  designStyle?: string[];

  @ApiPropertyOptional({
    description: '情感标签，需全部命中',
    type: [String],
  })
  @Transform(({ value }) => transformToArray(value))
  @IsOptional()
  @IsString({ each: true })
  feeling?: string[];
}
