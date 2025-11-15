import { ScreenListQueryDto } from './dto/screen-list-query.dto';
import { ScreenFilterQueryDto } from './dto/screen-filter-query.dto';
import { ScreenFilterResponseDto } from './dto/screen-filter-response.dto';
import { ScreenFuzzySearchQueryDto } from './dto/screen-fuzzy-search-query.dto';
import { ScreenPreciseSearchQueryDto } from './dto/screen-precise-search-query.dto';
import { ScreenSearchResultDto } from './dto/screen-search-result.dto';
import { ScreenAiSearchRequestDto, ScreenAiSearchResponseDto } from './dto/screen-ai-search.dto';
import { ScreenService } from './screen.service';
import { Screen } from './entities/screen.entity';
import { ScreenAiService } from './screen-ai.service';
export declare class ScreenController {
    private readonly screenService;
    private readonly screenAiService;
    constructor(screenService: ScreenService, screenAiService: ScreenAiService);
    findByProject(req: any, query: ScreenListQueryDto): Promise<import("../../common/dto/pagination.dto").PaginationDto<Screen>>;
    getFilters(query: ScreenFilterQueryDto): Promise<ScreenFilterResponseDto>;
    preciseSearch(req: any, query: ScreenPreciseSearchQueryDto): Promise<import("../../common/dto/pagination.dto").PaginationDto<Screen>>;
    fuzzySearch(req: any, query: ScreenFuzzySearchQueryDto): Promise<import("../../common/dto/pagination.dto").PaginationDto<ScreenSearchResultDto>>;
    aiFuzzySearch(req: any, body: ScreenAiSearchRequestDto): Promise<ScreenAiSearchResponseDto>;
}
