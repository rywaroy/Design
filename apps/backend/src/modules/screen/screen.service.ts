import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ScreenFilterQueryDto } from './dto/screen-filter-query.dto';
import { ScreenFilterResponseDto } from './dto/screen-filter-response.dto';
import { ScreenFuzzySearchQueryDto } from './dto/screen-fuzzy-search-query.dto';
import { ScreenListQueryDto } from './dto/screen-list-query.dto';
import { ScreenPreciseSearchQueryDto } from './dto/screen-precise-search-query.dto';
import { ScreenSearchResultDto } from './dto/screen-search-result.dto';
import { Screen, ScreenDocument } from './entities/screen.entity';
import {
  Favorite,
  FavoriteDocument,
  FavoriteTargetType,
} from '../favorite/entities/favorite.entity';
import {
  appCategoryData,
  buildSecondLevelLookup,
  collectFirstLevelNames,
  componentIndexData,
  layoutTypeData,
  pageTypeData,
  tagsComponentsData,
  tagsPrimaryData,
  tagsStyleData,
} from './utils/tag-taxonomy.util';

interface FilterDatasetConfig {
  key: string;
  label: string;
  firstLevel: string[];
  secondLevelLookup: Record<string, string[]>;
}

const createFilterDataset = (
  key: string,
  label: string,
  nodes: Parameters<typeof collectFirstLevelNames>[0],
): FilterDatasetConfig => ({
  key,
  label,
  firstLevel: collectFirstLevelNames(nodes),
  secondLevelLookup: buildSecondLevelLookup(nodes),
});

const FILTER_DATASET_LIST: FilterDatasetConfig[] = [
  createFilterDataset('page_type', '页面类型', pageTypeData),
  createFilterDataset('app_category', '应用分类', appCategoryData),
  createFilterDataset('component_index', '组件索引', componentIndexData),
  createFilterDataset('tags_primary', '功能标签', tagsPrimaryData),
  createFilterDataset('tags_style', '风格标签', tagsStyleData),
  createFilterDataset('tags_components', '组件标签', tagsComponentsData),
  createFilterDataset('layout_type', '页面布局', layoutTypeData),
];

const FILTER_DATASET_MAP = FILTER_DATASET_LIST.reduce<
  Record<string, FilterDatasetConfig>
>((acc, item) => {
  acc[item.key] = item;
  return acc;
}, {});

@Injectable()
export class ScreenService {
  constructor(
    @InjectModel(Screen.name)
    private readonly screenModel: Model<ScreenDocument>,
    @InjectModel(Favorite.name)
    private readonly favoriteModel: Model<FavoriteDocument>,
  ) {}

  private async attachFavoriteFlag<T extends { screenId: string }>(
    userId: string,
    items: T[],
  ): Promise<T[]> {
    if (items.length === 0) {
      return items;
    }

    const favorites = await this.favoriteModel
      .find({
        userId,
        targetType: FavoriteTargetType.SCREEN,
        targetId: { $in: items.map((item) => item.screenId) },
      })
      .select('targetId')
      .lean()
      .exec();

    const favoriteIds = new Set(favorites.map((favorite) => favorite.targetId));

    return items.map((item) => ({
      ...item,
      isFavorite: favoriteIds.has(item.screenId),
    }));
  }

  async findByProject(
    userId: string,
    query: ScreenListQueryDto,
  ): Promise<PaginationDto<Screen>> {
    const { projectId, page = 1, pageSize = 20 } = query;

    const filter: FilterQuery<Screen> = {
      projectId,
    };

    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.screenModel
        .find(filter)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean()
        .exec(),
      this.screenModel.countDocuments(filter).exec(),
    ]);

    const favorites = await this.favoriteModel
      .find({
        userId,
        targetType: FavoriteTargetType.SCREEN,
        targetId: { $in: items.map((item) => item.screenId) },
      })
      .select('targetId')
      .lean()
      .exec();
    const favoriteIds = new Set(favorites.map((favorite) => favorite.targetId));

    const itemsWithFavorite = items.map((item) => ({
      ...item,
      isFavorite: favoriteIds.has(item.screenId),
    }));

    return {
      items: itemsWithFavorite,
      total,
      page,
      pageSize,
    };
  }

  async getFilterOptions(
    query: ScreenFilterQueryDto,
  ): Promise<ScreenFilterResponseDto> {
    void query?.projectId; // 暂不根据项目过滤

    const categoryKey = query.category?.toLowerCase();
    const parentName = query.parent;

    if (categoryKey) {
      const dataset = FILTER_DATASET_MAP[categoryKey];
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
      categories: FILTER_DATASET_LIST.map((dataset) => ({
        key: dataset.key,
        label: dataset.label,
        options: dataset.firstLevel,
      })),
    };
  }

  async preciseSearch(
    userId: string,
    query: ScreenPreciseSearchQueryDto,
  ): Promise<PaginationDto<Screen>> {
    const {
      page = 1,
      pageSize = 10,
      projectId,
      platform,
      pageTypeL2,
      appCategoryL2,
      designSystem,
      typeL2,
      componentIndexL2,
      tagsPrimaryL2,
      tagsStyleL2,
      tagsComponentsL2,
      designStyle,
    } = query;

    const filter: FilterQuery<Screen> = {};

    if (projectId) {
      filter.projectId = projectId;
    }

    const applyStringOrArray = (
      field: keyof Screen,
      value?: string | string[],
    ) => {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return;
      }

      const values = Array.isArray(value) ? value : [value];
      const cleaned = values
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0);
      if (cleaned.length === 0) {
        return;
      }

      if (cleaned.length === 1) {
        filter[field] = new RegExp(
          `^${ScreenService.escapeRegExp(cleaned[0])}$`,
          'i',
        ) as any;
        return;
      }

      filter[field] = {
        $in: cleaned.map(
          (item) => new RegExp(`^${ScreenService.escapeRegExp(item)}$`, 'i'),
        ),
      } as any;
    };

    const applyArrayAny = (field: keyof Screen, values?: string[]) => {
      if (!values || values.length === 0) {
        return;
      }
      const cleaned = values
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0);
      if (cleaned.length === 0) {
        return;
      }
      filter[field] = {
        $in: cleaned.map(
          (item) => new RegExp(`^${ScreenService.escapeRegExp(item)}$`, 'i'),
        ),
      } as any;
    };

    applyStringOrArray('platform', platform);
    applyStringOrArray('pageTypeL2', pageTypeL2);
    applyStringOrArray('appCategoryL2', appCategoryL2);
    applyStringOrArray('designSystem', designSystem);
    applyStringOrArray('typeL2', typeL2);

    applyArrayAny('componentIndexL2', componentIndexL2);
    applyArrayAny('tagsPrimaryL2', tagsPrimaryL2);
    applyArrayAny('tagsStyleL2', tagsStyleL2);
    applyArrayAny('tagsComponentsL2', tagsComponentsL2);
    applyArrayAny('designStyle', designStyle);

    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.screenModel
        .find(filter)
        .sort({ isRecommended: -1, order: 1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean()
        .exec(),
      this.screenModel.countDocuments(filter).exec(),
    ]);

    const itemsWithFavorite = await this.attachFavoriteFlag(userId, items);

    return {
      items: itemsWithFavorite,
      total,
      page,
      pageSize,
    };
  }

  async fuzzySearch(
    userId: string,
    query: ScreenFuzzySearchQueryDto,
  ): Promise<PaginationDto<ScreenSearchResultDto>> {
    const {
      page = 1,
      pageSize = 10,
      projectId,
      platform,
      pageTypeL2,
      appCategoryL2,
      designSystem,
      typeL2,
      componentIndexL2,
      tagsPrimaryL2,
      tagsStyleL2,
      tagsComponentsL2,
    } = query;

    const baseFilter: FilterQuery<Screen> = {};
    if (projectId) {
      baseFilter.projectId = projectId;
    }
    if (platform) {
      const trimmedPlatform = platform.trim();
      if (trimmedPlatform) {
        baseFilter.platform = new RegExp(
          `^${ScreenService.escapeRegExp(trimmedPlatform)}$`,
          'i',
        ) as any;
      }
    }

    type Criterion = {
      matches: (screen: Record<string, any>) => boolean;
      condition: FilterQuery<Screen>;
    };

    const criteria: Criterion[] = [];

    const addStringCriterion = (field: keyof Screen, values?: string[]) => {
      if (!values || values.length === 0) {
        return;
      }
      const cleaned = values
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0);
      if (cleaned.length === 0) {
        return;
      }
      const lookup = new Set(cleaned.map((item) => item.toLowerCase()));
      const regexes = cleaned.map(
        (item) => new RegExp(`^${ScreenService.escapeRegExp(item)}$`, 'i'),
      );
      criteria.push({
        matches: (screen) => {
          const value = screen[field as string];
          return typeof value === 'string'
            ? lookup.has(value.toLowerCase())
            : false;
        },
        condition: {
          [field]: {
            $in: regexes,
          },
        } as FilterQuery<Screen>,
      });
    };

    const addArrayCriterion = (field: keyof Screen, values?: string[]) => {
      if (!values || values.length === 0) {
        return;
      }
      const cleaned = values
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0);
      if (cleaned.length === 0) {
        return;
      }
      const lookup = new Set(cleaned.map((item) => item.toLowerCase()));
      const regexes = cleaned.map(
        (item) => new RegExp(`^${ScreenService.escapeRegExp(item)}$`, 'i'),
      );
      criteria.push({
        matches: (screen) => {
          const value = screen[field as string] as string[] | undefined;
          if (!Array.isArray(value) || value.length === 0) {
            return false;
          }
          return value
            .map((item) => item.toLowerCase())
            .some((item) => lookup.has(item));
        },
        condition: {
          [field]: {
            $in: regexes,
          },
        } as FilterQuery<Screen>,
      });
    };

    addStringCriterion('pageTypeL2', pageTypeL2);
    addStringCriterion('appCategoryL2', appCategoryL2);
    addStringCriterion('designSystem', designSystem);
    addStringCriterion('typeL2', typeL2);

    addArrayCriterion('componentIndexL2', componentIndexL2);
    addArrayCriterion('tagsPrimaryL2', tagsPrimaryL2);
    addArrayCriterion('tagsStyleL2', tagsStyleL2);
    addArrayCriterion('tagsComponentsL2', tagsComponentsL2);

    const totalCriteria = criteria.length;
    if (totalCriteria === 0) {
      throw new BadRequestException('请至少提供一个解析字段进行模糊搜索');
    }

    const queryBuilder = this.screenModel.find(baseFilter);
    const orConditions = criteria.map((item) => item.condition);
    if (orConditions.length > 0) {
      queryBuilder.or(orConditions);
    }

    const documents = (await queryBuilder.lean().exec()) as (Screen & {
      [key: string]: any;
    })[];

    const scored = documents
      .map((doc) => {
        const matches = criteria.reduce(
          (count, criterion) => (criterion.matches(doc) ? count + 1 : count),
          0,
        );

        const percentage = Number(((matches / totalCriteria) * 100).toFixed(2));

        return {
          ...doc,
          matchPercentage: percentage,
        };
      })
      .filter((item) => item.matchPercentage >= 50)
      .sort((a, b) => {
        if (b.matchPercentage !== a.matchPercentage) {
          return b.matchPercentage - a.matchPercentage;
        }
        if (a.isRecommended !== b.isRecommended) {
          return a.isRecommended ? -1 : 1;
        }
        const orderA =
          typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
        const orderB =
          typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        const aDate = a.updatedAt ?? a.createdAt ?? 0;
        const bDate = b.updatedAt ?? b.createdAt ?? 0;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

    const skip = (page - 1) * pageSize;
    const pagedItems = scored.slice(skip, skip + pageSize);

    const itemsWithFavorite = await this.attachFavoriteFlag(userId, pagedItems);

    return {
      items: itemsWithFavorite,
      total: scored.length,
      page,
      pageSize,
    };
  }

  private static escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
