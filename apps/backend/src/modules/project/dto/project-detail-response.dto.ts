import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../entities/project.entity';

export class ProjectDetailResponseDto {
  @ApiProperty({ description: '项目详情', type: () => Project })
  project: Project;
}
