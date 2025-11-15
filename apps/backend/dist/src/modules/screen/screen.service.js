"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ScreenService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreenService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const screen_entity_1 = require("./entities/screen.entity");
const favorite_entity_1 = require("../favorite/entities/favorite.entity");
const tag_taxonomy_util_1 = require("./utils/tag-taxonomy.util");
const createFilterDataset = (key, label, nodes) => ({
    key,
    label,
    firstLevel: (0, tag_taxonomy_util_1.collectFirstLevelNames)(nodes),
    secondLevelLookup: (0, tag_taxonomy_util_1.buildSecondLevelLookup)(nodes),
});
const FILTER_DATASET_LIST = [
    createFilterDataset('page_type', '页面类型', tag_taxonomy_util_1.pageTypeData),
    createFilterDataset('app_category', '应用分类', tag_taxonomy_util_1.appCategoryData),
    createFilterDataset('component_index', '组件索引', tag_taxonomy_util_1.componentIndexData),
    createFilterDataset('tags_primary', '功能标签', tag_taxonomy_util_1.tagsPrimaryData),
    createFilterDataset('tags_style', '风格标签', tag_taxonomy_util_1.tagsStyleData),
    createFilterDataset('tags_components', '组件标签', tag_taxonomy_util_1.tagsComponentsData),
    createFilterDataset('layout_type', '页面布局', tag_taxonomy_util_1.layoutTypeData),
];
const FILTER_DATASET_MAP = FILTER_DATASET_LIST.reduce((acc, item) => {
    acc[item.key] = item;
    return acc;
}, {});
let ScreenService = ScreenService_1 = class ScreenService {
    constructor(screenModel, favoriteModel) {
        this.screenModel = screenModel;
        this.favoriteModel = favoriteModel;
    }
    async attachFavoriteFlag(userId, items) {
        if (items.length === 0) {
            return items;
        }
        const favorites = await this.favoriteModel
            .find({
            userId,
            targetType: favorite_entity_1.FavoriteTargetType.SCREEN,
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
    async findByProject(userId, query) {
        const { projectId, page = 1, pageSize = 20 } = query;
        const filter = {
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
            targetType: favorite_entity_1.FavoriteTargetType.SCREEN,
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
    async getFilterOptions(query) {
        void query?.projectId;
        const categoryKey = query.category?.toLowerCase();
        const parentName = query.parent;
        if (categoryKey) {
            const dataset = FILTER_DATASET_MAP[categoryKey];
            if (!dataset) {
                throw new common_1.BadRequestException(`未知的筛选类别: ${categoryKey}`);
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
    async preciseSearch(userId, query) {
        const { page = 1, pageSize = 10, projectId, platform, pageTypeL2, appCategoryL2, designSystem, typeL2, componentIndexL2, tagsPrimaryL2, tagsStyleL2, tagsComponentsL2, designStyle, } = query;
        const filter = {};
        if (projectId) {
            filter.projectId = projectId;
        }
        const applyStringOrArray = (field, value) => {
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
                filter[field] = new RegExp(`^${ScreenService_1.escapeRegExp(cleaned[0])}$`, 'i');
                return;
            }
            filter[field] = {
                $in: cleaned.map((item) => new RegExp(`^${ScreenService_1.escapeRegExp(item)}$`, 'i')),
            };
        };
        const applyArrayAny = (field, values) => {
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
                $in: cleaned.map((item) => new RegExp(`^${ScreenService_1.escapeRegExp(item)}$`, 'i')),
            };
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
    async fuzzySearch(userId, query) {
        const { page = 1, pageSize = 10, projectId, platform, pageTypeL2, appCategoryL2, designSystem, typeL2, componentIndexL2, tagsPrimaryL2, tagsStyleL2, tagsComponentsL2, } = query;
        const baseFilter = {};
        if (projectId) {
            baseFilter.projectId = projectId;
        }
        if (platform) {
            const trimmedPlatform = platform.trim();
            if (trimmedPlatform) {
                baseFilter.platform = new RegExp(`^${ScreenService_1.escapeRegExp(trimmedPlatform)}$`, 'i');
            }
        }
        const criteria = [];
        const addStringCriterion = (field, values) => {
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
            const regexes = cleaned.map((item) => new RegExp(`^${ScreenService_1.escapeRegExp(item)}$`, 'i'));
            criteria.push({
                matches: (screen) => {
                    const value = screen[field];
                    return typeof value === 'string'
                        ? lookup.has(value.toLowerCase())
                        : false;
                },
                condition: {
                    [field]: {
                        $in: regexes,
                    },
                },
            });
        };
        const addArrayCriterion = (field, values) => {
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
            const regexes = cleaned.map((item) => new RegExp(`^${ScreenService_1.escapeRegExp(item)}$`, 'i'));
            criteria.push({
                matches: (screen) => {
                    const value = screen[field];
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
                },
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
            throw new common_1.BadRequestException('请至少提供一个解析字段进行模糊搜索');
        }
        const queryBuilder = this.screenModel.find(baseFilter);
        const orConditions = criteria.map((item) => item.condition);
        if (orConditions.length > 0) {
            queryBuilder.or(orConditions);
        }
        const documents = (await queryBuilder.lean().exec());
        const scored = documents
            .map((doc) => {
            const matches = criteria.reduce((count, criterion) => (criterion.matches(doc) ? count + 1 : count), 0);
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
            const orderA = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
            const orderB = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
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
    static escapeRegExp(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
};
exports.ScreenService = ScreenService;
exports.ScreenService = ScreenService = ScreenService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(screen_entity_1.Screen.name)),
    __param(1, (0, mongoose_1.InjectModel)(favorite_entity_1.Favorite.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], ScreenService);
//# sourceMappingURL=screen.service.js.map