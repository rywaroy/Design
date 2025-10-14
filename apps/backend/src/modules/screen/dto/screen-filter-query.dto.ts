import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

const trimValue = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ScreenFilterQueryDto {
  @ApiPropertyOptional({ description: '可选的项目 ID，用于限定范围' })
  @Transform(trimValue)
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({
    description:
      '筛选类别 key，例如 app_category、page_type、component_index 等',
  })
  @Transform(trimValue)
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '第一层分类名称，用于查询子分类' })
  @Transform(trimValue)
  @IsOptional()
  @IsString()
  parent?: string;
}
