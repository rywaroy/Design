import { ProjectListQueryDto } from './dto/project-list-query.dto';
import { ProjectDetailQueryDto } from './dto/project-detail-query.dto';
import { ProjectDetailResponseDto } from './dto/project-detail-response.dto';
import { ProjectFilterQueryDto } from './dto/project-filter-query.dto';
import { ProjectFilterResponseDto } from './dto/project-filter-response.dto';
import { ProjectService } from './project.service';
import { Project } from './entities/project.entity';
import { ProjectAiSearchRequestDto, ProjectAiSearchResponseDto } from './dto/project-ai-search.dto';
import { ProjectAiService } from './project-ai.service';
export declare class ProjectController {
    private readonly projectService;
    private readonly projectAiService;
    constructor(projectService: ProjectService, projectAiService: ProjectAiService);
    getFilters(query: ProjectFilterQueryDto): Promise<ProjectFilterResponseDto>;
    findAll(req: any, body: ProjectListQueryDto): Promise<import("../../common/dto/pagination.dto").PaginationDto<Project>>;
    findDetail(req: any, query: ProjectDetailQueryDto): Promise<ProjectDetailResponseDto>;
    aiSearch(req: any, body: ProjectAiSearchRequestDto): Promise<ProjectAiSearchResponseDto>;
}
