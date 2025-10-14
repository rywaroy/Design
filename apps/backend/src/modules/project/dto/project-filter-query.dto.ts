import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

const trimValue = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ProjectFilterQueryDto {
  @ApiPropertyOptional({
    description: '筛选类别 key，例如 application_type、industry_sector',
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
