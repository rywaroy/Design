import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ScreenSearchResultDto } from './screen-search-result.dto';
export declare class ScreenAiSearchRequestDto {
    requirement: string;
    page: number;
    pageSize: number;
    projectId?: string;
    platform?: string;
}
export declare class ScreenAiDimensionSelectionDto {
    firstLevel: string[];
    secondLevel: string[];
    mapping: Record<string, string[]>;
}
export declare class ScreenAiDimensionIntentDto {
    relevant: boolean;
    reason?: string;
    confidence?: number;
}
export declare class ScreenAiTagsDto {
    appCategory: ScreenAiDimensionSelectionDto;
    componentIndex: ScreenAiDimensionSelectionDto;
    layoutType: ScreenAiDimensionSelectionDto;
    pageType: ScreenAiDimensionSelectionDto;
    tagsPrimary: ScreenAiDimensionSelectionDto;
    tagsStyle: ScreenAiDimensionSelectionDto;
    tagsComponents: ScreenAiDimensionSelectionDto;
}
export declare class ScreenAiMetaDto {
    intent: Record<string, ScreenAiDimensionIntentDto>;
    notice?: string;
    rawResponses?: string[];
}
export declare class ScreenAiSearchResponseDto {
    tags: ScreenAiTagsDto;
    llmMeta: ScreenAiMetaDto;
    search: PaginationDto<ScreenSearchResultDto>;
}
