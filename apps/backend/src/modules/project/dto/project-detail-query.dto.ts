import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ProjectDetailQueryDto {
  @ApiProperty({ description: '项目 ID' })
  @IsString()
  projectId: string;
}
