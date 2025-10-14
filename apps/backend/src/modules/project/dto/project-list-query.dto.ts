import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const toStringArray = ({ value }: { value: unknown }) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : null))
      .filter((item): item is string => Boolean(item));
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return undefined;
};

export class ProjectListQueryDto {
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

  @ApiPropertyOptional({
    description: '限定平台，可选 ios 或 web',
    enum: ['ios', 'web'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ios', 'web'])
  platform?: string;

  @ApiPropertyOptional({ description: '按应用名称模糊匹配' })
  @IsOptional()
  @IsString()
  appName?: string;

  @ApiPropertyOptional({
    description: '按应用类型筛选，多个值逗号分隔或重复传参，满足任意一个即可',
    type: [String],
  })
  @Transform(toStringArray)
  @IsOptional()
  @IsString({ each: true })
  applicationType?: string[];

  @ApiPropertyOptional({
    description: '按行业领域筛选，多个值逗号分隔或重复传参，满足任意一个即可',
    type: [String],
  })
  @Transform(toStringArray)
  @IsOptional()
  @IsString({ each: true })
  industrySector?: string[];
}
