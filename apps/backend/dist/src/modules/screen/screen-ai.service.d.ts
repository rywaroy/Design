import { AiService } from '../ai/ai.service';
import { ScreenService } from './screen.service';
import { ScreenAiSearchRequestDto, ScreenAiSearchResponseDto } from './dto/screen-ai-search.dto';
export declare class ScreenAiService {
    private readonly aiService;
    private readonly screenService;
    private readonly logger;
    constructor(aiService: AiService, screenService: ScreenService);
    searchWithRequirement(userId: string, dto: ScreenAiSearchRequestDto): Promise<ScreenAiSearchResponseDto>;
    private detectDimensionIntent;
    private resolveDimensionSelections;
    private selectFirstLevelTags;
    private selectSecondLevelTags;
    private buildFuzzySearchQuery;
    private composeTagsDto;
    private composeMetaDto;
}
