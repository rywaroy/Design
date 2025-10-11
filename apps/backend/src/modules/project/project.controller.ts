import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../../common/decorator/pagination.decorator';
import { ProjectListQueryDto } from './dto/project-list-query.dto';
import { ProjectDetailQueryDto } from './dto/project-detail-query.dto';
import { ProjectDetailResponseDto } from './dto/project-detail-response.dto';
import { ProjectService } from './project.service';
import { Project } from './entities/project.entity';

@ApiTags('项目')
@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @ApiOperation({ summary: '项目列表' })
  @ApiPaginatedResponse(Project, '获取项目列表成功')
  findAll(@Query() query: ProjectListQueryDto) {
    return this.projectService.findAll(query);
  }

  @Get('detail')
  @ApiOperation({ summary: '项目详情' })
  @ApiOkResponse({
    description: '获取项目详情成功',
    type: ProjectDetailResponseDto,
  })
  findDetail(@Query() query: ProjectDetailQueryDto) {
    return this.projectService.findDetail(query.projectId);
  }
}
