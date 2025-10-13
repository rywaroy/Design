import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../../common/decorator/pagination.decorator';
import { ProjectListQueryDto } from './dto/project-list-query.dto';
import { ProjectDetailQueryDto } from './dto/project-detail-query.dto';
import { ProjectDetailResponseDto } from './dto/project-detail-response.dto';
import { ProjectService } from './project.service';
import { Project } from './entities/project.entity';
import { AuthGuard } from '../../common/guards/auth.guard';

@ApiTags('项目')
@UseGuards(AuthGuard)
@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @ApiOperation({ summary: '项目列表' })
  @ApiPaginatedResponse(Project, '获取项目列表成功')
  findAll(@Request() req, @Query() query: ProjectListQueryDto) {
    const userId = (req.user?.id ?? req.user?._id?.toString()) as string;
    return this.projectService.findAll(userId, query);
  }

  @Get('detail')
  @ApiOperation({ summary: '项目详情' })
  @ApiOkResponse({
    description: '获取项目详情成功',
    type: ProjectDetailResponseDto,
  })
  findDetail(@Request() req, @Query() query: ProjectDetailQueryDto) {
    const userId = (req.user?.id ?? req.user?._id?.toString()) as string;
    return this.projectService.findDetail(userId, query.projectId);
  }
}
