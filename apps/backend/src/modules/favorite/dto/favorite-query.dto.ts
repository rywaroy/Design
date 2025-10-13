import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsIn, IsOptional, Max, Min } from 'class-validator';

export class FavoriteQueryDto {
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

  @ApiPropertyOptional({ description: '平台筛选', enum: ['ios', 'web'] })
  @IsOptional()
  @IsIn(['ios', 'web'])
  platform?: 'ios' | 'web';
}
