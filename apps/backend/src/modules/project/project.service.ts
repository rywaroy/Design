import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ProjectListQueryDto } from './dto/project-list-query.dto';
import { ProjectDetailResponseDto } from './dto/project-detail-response.dto';
import { ProjectFilterQueryDto } from './dto/project-filter-query.dto';
import { ProjectFilterResponseDto } from './dto/project-filter-response.dto';
import { Project, ProjectDocument } from './entities/project.entity';
import {
  Favorite,
  FavoriteDocument,
  FavoriteTargetType,
} from '../favorite/entities/favorite.entity';
import {
  applicationTypeData,
  buildSecondLevelLookup,
  collectFirstLevelNames,
  industrySectorData,
} from './utils/project-taxonomy.util';

interface ProjectFilterDatasetConfig {
  key: string;
  label: string;
  firstLevel: string[];
  secondLevelLookup: Record<string, string[]>;
}

const createFilterDataset = (
  key: string,
  label: string,
  nodes: Parameters<typeof collectFirstLevelNames>[0],
): ProjectFilterDatasetConfig => ({
  key,
  label,
  firstLevel: collectFirstLevelNames(nodes),
  secondLevelLookup: buildSecondLevelLookup(nodes),
});

const PROJECT_FILTER_DATASET_LIST: ProjectFilterDatasetConfig[] = [
  createFilterDataset('application_type', '应用类型', applicationTypeData),
  createFilterDataset('industry_sector', '行业领域', industrySectorData),
];

const PROJECT_FILTER_DATASET_MAP = PROJECT_FILTER_DATASET_LIST.reduce<
  Record<string, ProjectFilterDatasetConfig>
>((acc, item) => {
  acc[item.key] = item;
  return acc;
}, {});

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
    const {
      page = 1,
      pageSize = 10,
      platform,
      appName,
      applicationType,
      industrySector,
    } = query;
    const skip = (page - 1) * pageSize;
    const filter: FilterQuery<Project> = {};

    if (platform) {
      filter.platform = platform;
    }

    const applicationTypeFilter =
      applicationType?.filter((item) => item.trim().length > 0) ?? [];
    if (applicationTypeFilter.length > 0) {
      filter.applicationType = { $in: applicationTypeFilter };
    }

    const industrySectorFilter =
      industrySector?.filter((item) => item.trim().length > 0) ?? [];
    if (industrySectorFilter.length > 0) {
      filter.industrySector = { $in: industrySectorFilter };
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

  async getFilterOptions(
    query: ProjectFilterQueryDto,
  ): Promise<ProjectFilterResponseDto> {
    const categoryKey = query.category?.toLowerCase();
    const parentName = query.parent;

    if (categoryKey) {
      const dataset = PROJECT_FILTER_DATASET_MAP[categoryKey];
      if (!dataset) {
        throw new BadRequestException(`未知的筛选类别: ${categoryKey}`);
      }

      if (parentName) {
        const trimmedParent = parentName.trim();
        const children = dataset.secondLevelLookup[trimmedParent] ?? [];
        return {
          categories: [
            {
              key: dataset.key,
              label: dataset.label,
              parent: trimmedParent,
              options: children,
            },
          ],
        };
      }

      return {
        categories: [
          {
            key: dataset.key,
            label: dataset.label,
            options: dataset.firstLevel,
          },
        ],
      };
    }

    return {
      categories: PROJECT_FILTER_DATASET_LIST.map((dataset) => ({
        key: dataset.key,
        label: dataset.label,
        options: dataset.firstLevel,
      })),
    };
  }
}
