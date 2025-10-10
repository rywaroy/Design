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
}
