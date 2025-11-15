import { Model } from 'mongoose';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { FavoriteQueryDto } from './dto/favorite-query.dto';
import { FavoriteDocument } from './entities/favorite.entity';
import { Project, ProjectDocument } from '../project/entities/project.entity';
import { Screen, ScreenDocument } from '../screen/entities/screen.entity';
export declare class FavoriteService {
    private readonly favoriteModel;
    private readonly projectModel;
    private readonly screenModel;
    constructor(favoriteModel: Model<FavoriteDocument>, projectModel: Model<ProjectDocument>, screenModel: Model<ScreenDocument>);
    private ensureProjectExists;
    private ensureScreenExists;
    addProjectFavorite(userId: string, projectId: string): Promise<boolean>;
    removeProjectFavorite(userId: string, projectId: string): Promise<boolean>;
    addScreenFavorite(userId: string, screenId: string): Promise<boolean>;
    removeScreenFavorite(userId: string, screenId: string): Promise<boolean>;
    findProjectFavorites(userId: string, query: FavoriteQueryDto): Promise<PaginationDto<Project>>;
    findScreenFavorites(userId: string, query: FavoriteQueryDto): Promise<PaginationDto<Screen>>;
}
