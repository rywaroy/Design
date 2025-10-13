import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ProjectListQueryDto } from './dto/project-list-query.dto';
import { ProjectDetailResponseDto } from './dto/project-detail-response.dto';
import { Project, ProjectDocument } from './entities/project.entity';
import {
  Favorite,
  FavoriteDocument,
  FavoriteTargetType,
} from '../favorite/entities/favorite.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Favorite.name)
    private readonly favoriteModel: Model<FavoriteDocument>,
  ) {}

  async findAll(
    userId: string,
    query: ProjectListQueryDto,
  ): Promise<PaginationDto<Project>> {
    const { page = 1, pageSize = 10, platform, appName } = query;
    const skip = (page - 1) * pageSize;
    const filter: FilterQuery<Project> = {};

    if (platform) {
      filter.platform = platform;
    }

    if (appName) {
      filter.appName = { $regex: appName, $options: 'i' };
    }

    const [items, total] = await Promise.all([
      this.projectModel
        .find(filter)
        .sort({ recommendedCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean()
        .exec(),
      this.projectModel.countDocuments(filter).exec(),
    ]);

    let favoriteIds = new Set<string>();
    if (items.length > 0) {
      const favorites = await this.favoriteModel
        .find({
          userId,
          targetType: FavoriteTargetType.PROJECT,
          targetId: { $in: items.map((item) => item.projectId) },
        })
        .select('targetId')
        .lean()
        .exec();
      favoriteIds = new Set(favorites.map((favorite) => favorite.targetId));
    }

    const itemsWithFavorite = items.map((item) => ({
      ...item,
      isFavorite: favoriteIds.has(item.projectId),
    }));

    return {
      items: itemsWithFavorite,
      total,
      page,
      pageSize,
    };
  }

  async findDetail(
    userId: string,
    projectId: string,
  ): Promise<ProjectDetailResponseDto> {
    const project = await this.projectModel.findOne({ projectId }).lean();
    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    const favorite = await this.favoriteModel.exists({
      userId,
      targetType: FavoriteTargetType.PROJECT,
      targetId: project.projectId,
    });

    return { project: { ...project, isFavorite: Boolean(favorite) } };
  }
}
