import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

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
}
