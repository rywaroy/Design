import { Model } from 'mongoose';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ProjectListQueryDto } from './dto/project-list-query.dto';
import { ProjectDetailResponseDto } from './dto/project-detail-response.dto';
import { ProjectFilterQueryDto } from './dto/project-filter-query.dto';
import { ProjectFilterResponseDto } from './dto/project-filter-response.dto';
import { Project, ProjectDocument } from './entities/project.entity';
import { FavoriteDocument } from '../favorite/entities/favorite.entity';
export declare class ProjectService {
    private readonly projectModel;
    private readonly favoriteModel;
    constructor(projectModel: Model<ProjectDocument>, favoriteModel: Model<FavoriteDocument>);
    findAll(userId: string, query: ProjectListQueryDto): Promise<PaginationDto<Project>>;
    findDetail(userId: string, projectId: string): Promise<ProjectDetailResponseDto>;
    getFilterOptions(query: ProjectFilterQueryDto): Promise<ProjectFilterResponseDto>;
}
