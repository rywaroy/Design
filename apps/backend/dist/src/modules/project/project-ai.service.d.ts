import { AiService } from '../ai/ai.service';
import { ProjectService } from './project.service';
import { ProjectAiSearchRequestDto, ProjectAiSearchResponseDto } from './dto/project-ai-search.dto';
export declare class ProjectAiService {
    private readonly aiService;
    private readonly projectService;
    private readonly logger;
    constructor(aiService: AiService, projectService: ProjectService);
    searchWithRequirement(userId: string, dto: ProjectAiSearchRequestDto): Promise<ProjectAiSearchResponseDto>;
    private detectDimensionIntent;
    private resolveDimensionSelections;
    private selectFirstLevelTags;
    private selectSecondLevelTags;
    private buildProjectQuery;
    private composeTagsDto;
    private composeMetaDto;
}
