import { Model } from 'mongoose';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ScreenFilterQueryDto } from './dto/screen-filter-query.dto';
import { ScreenFilterResponseDto } from './dto/screen-filter-response.dto';
import { ScreenFuzzySearchQueryDto } from './dto/screen-fuzzy-search-query.dto';
import { ScreenListQueryDto } from './dto/screen-list-query.dto';
import { ScreenPreciseSearchQueryDto } from './dto/screen-precise-search-query.dto';
import { ScreenSearchResultDto } from './dto/screen-search-result.dto';
import { Screen, ScreenDocument } from './entities/screen.entity';
import { FavoriteDocument } from '../favorite/entities/favorite.entity';
export declare class ScreenService {
    private readonly screenModel;
    private readonly favoriteModel;
    constructor(screenModel: Model<ScreenDocument>, favoriteModel: Model<FavoriteDocument>);
    private attachFavoriteFlag;
    findByProject(userId: string, query: ScreenListQueryDto): Promise<PaginationDto<Screen>>;
    getFilterOptions(query: ScreenFilterQueryDto): Promise<ScreenFilterResponseDto>;
    preciseSearch(userId: string, query: ScreenPreciseSearchQueryDto): Promise<PaginationDto<Screen>>;
    fuzzySearch(userId: string, query: ScreenFuzzySearchQueryDto): Promise<PaginationDto<ScreenSearchResultDto>>;
    private static escapeRegExp;
}
