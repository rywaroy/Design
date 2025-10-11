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
  appCategoryData,
  collectSecondLevelNames,
  componentIndexData,
  layoutTypeData,
  pageTypeData,
  tagsComponentsData,
  tagsPrimaryData,
  tagsStyleData,
} from './utils/tag-taxonomy.util';

const PAGE_TYPE_L2 = collectSecondLevelNames(pageTypeData);
const APP_CATEGORY_L2 = collectSecondLevelNames(appCategoryData);
const COMPONENT_INDEX_L2 = collectSecondLevelNames(componentIndexData);
const TAGS_PRIMARY_L2 = collectSecondLevelNames(tagsPrimaryData);
const TAGS_STYLE_L2 = collectSecondLevelNames(tagsStyleData);
const TAGS_COMPONENTS_L2 = collectSecondLevelNames(tagsComponentsData);
const TYPE_L2 = collectSecondLevelNames(layoutTypeData);
const PLATFORMS = ['ios', 'web'];

@Injectable()
export class ScreenService {
  constructor(
    @InjectModel(Screen.name)
    private readonly screenModel: Model<ScreenDocument>,
  ) {}

  async findByProject(
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
        .sort({ isRecommended: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean()
        .exec(),
      this.screenModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  async getFilterOptions(
    query: ScreenFilterQueryDto,
  ): Promise<ScreenFilterResponseDto> {
    // 直接返回预置的二级标签数据，后续若需要再切换为数据库筛选
    void query?.projectId; // 暂时不根据项目过滤

    const response = new ScreenFilterResponseDto();
    response.pageTypeL2 = PAGE_TYPE_L2;
    response.appCategoryL2 = APP_CATEGORY_L2;
    response.typeL2 = TYPE_L2;
    response.componentIndexL2 = COMPONENT_INDEX_L2;
    response.tagsPrimaryL2 = TAGS_PRIMARY_L2;
    response.tagsStyleL2 = TAGS_STYLE_L2;
    response.tagsComponentsL2 = TAGS_COMPONENTS_L2;
    response.platform = PLATFORMS;

    return response;
  }

  async preciseSearch(
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

    const applyString = (field: keyof Screen, value?: string) => {
      if (!value) {
        return;
      }
      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }
      filter[field] = new RegExp(
        `^${ScreenService.escapeRegExp(trimmed)}$`,
        'i',
      ) as any;
    };

    const applyArrayAll = (field: keyof Screen, values?: string[]) => {
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
        $all: cleaned.map(
          (item) => new RegExp(`^${ScreenService.escapeRegExp(item)}$`, 'i'),
        ),
      } as any;
    };

    applyString('platform', platform);
    applyString('pageTypeL2', pageTypeL2);
    applyString('appCategoryL2', appCategoryL2);
    applyString('designSystem', designSystem);
    applyString('typeL2', typeL2);

    applyArrayAll('componentIndexL2', componentIndexL2);
    applyArrayAll('tagsPrimaryL2', tagsPrimaryL2);
    applyArrayAll('tagsStyleL2', tagsStyleL2);
    applyArrayAll('tagsComponentsL2', tagsComponentsL2);
    applyArrayAll('designStyle', designStyle);

    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.screenModel
        .find(filter)
        .sort({ isRecommended: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean()
        .exec(),
      this.screenModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  async fuzzySearch(
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
        const aDate = a.updatedAt ?? a.createdAt ?? 0;
        const bDate = b.updatedAt ?? b.createdAt ?? 0;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

    const skip = (page - 1) * pageSize;
    const pagedItems = scored.slice(skip, skip + pageSize);

    return {
      items: pagedItems,
      total: scored.length,
      page,
      pageSize,
    };
  }

  private static escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
