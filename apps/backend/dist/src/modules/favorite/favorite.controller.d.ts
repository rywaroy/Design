import { FavoriteQueryDto } from './dto/favorite-query.dto';
import { FavoriteService } from './favorite.service';
import { Project } from '../project/entities/project.entity';
import { Screen } from '../screen/entities/screen.entity';
export declare class FavoriteController {
    private readonly favoriteService;
    constructor(favoriteService: FavoriteService);
    addProjectFavorite(req: any, projectId: string): Promise<boolean>;
    addScreenFavorite(req: any, screenId: string): Promise<boolean>;
    findProjectFavorites(req: any, query: FavoriteQueryDto): Promise<import("../../common/dto/pagination.dto").PaginationDto<Project>>;
    findScreenFavorites(req: any, query: FavoriteQueryDto): Promise<import("../../common/dto/pagination.dto").PaginationDto<Screen>>;
    cancelProjectFavorite(req: any, projectId: string): Promise<boolean>;
    cancelScreenFavorite(req: any, screenId: string): Promise<boolean>;
}
