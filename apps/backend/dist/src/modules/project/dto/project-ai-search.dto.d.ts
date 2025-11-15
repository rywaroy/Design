import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Project } from '../entities/project.entity';
export declare class ProjectAiSearchRequestDto {
    requirement: string;
    page: number;
    pageSize: number;
    platform?: string;
}
export declare class ProjectAiDimensionSelectionDto {
    firstLevel: string[];
    secondLevel: string[];
    mapping: Record<string, string[]>;
}
export declare class ProjectAiDimensionIntentDto {
    relevant: boolean;
    reason?: string;
    confidence?: number;
}
export declare class ProjectAiTagsDto {
    applicationType: ProjectAiDimensionSelectionDto;
    industrySector: ProjectAiDimensionSelectionDto;
}
export declare class ProjectAiMetaDto {
    intent: Record<string, ProjectAiDimensionIntentDto>;
    notice?: string;
    rawResponses?: string[];
}
export declare class ProjectAiSearchResponseDto {
    tags: ProjectAiTagsDto;
    llmMeta: ProjectAiMetaDto;
    search: PaginationDto<Project>;
}
