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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const project_entity_1 = require("./entities/project.entity");
const favorite_entity_1 = require("../favorite/entities/favorite.entity");
const project_taxonomy_util_1 = require("./utils/project-taxonomy.util");
const normalizeTagList = (input) => {
    if (Array.isArray(input)) {
        return Array.from(new Set(input
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter((item) => item.length > 0)));
    }
    if (typeof input === 'string') {
        const segments = input
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
        return Array.from(new Set(segments));
    }
    return [];
};
const createFilterDataset = (key, label, nodes) => ({
    key,
    label,
    firstLevel: (0, project_taxonomy_util_1.collectFirstLevelNames)(nodes),
    secondLevelLookup: (0, project_taxonomy_util_1.buildSecondLevelLookup)(nodes),
});
const PROJECT_FILTER_DATASET_LIST = [
    createFilterDataset('application_type', '应用类型', project_taxonomy_util_1.applicationTypeData),
    createFilterDataset('industry_sector', '行业领域', project_taxonomy_util_1.industrySectorData),
];
const PROJECT_FILTER_DATASET_MAP = PROJECT_FILTER_DATASET_LIST.reduce((acc, item) => {
    acc[item.key] = item;
    return acc;
}, {});
let ProjectService = class ProjectService {
    constructor(projectModel, favoriteModel) {
        this.projectModel = projectModel;
        this.favoriteModel = favoriteModel;
    }
    async findAll(userId, query) {
        const { page = 1, pageSize = 10, platform, appName, applicationType, industrySector, } = query;
        const skip = (page - 1) * pageSize;
        const filter = {};
        if (platform) {
            filter.platform = platform;
        }
        const applicationTypeFilter = normalizeTagList(applicationType);
        if (applicationTypeFilter.length > 0) {
            filter.applicationType = { $in: applicationTypeFilter };
        }
        const industrySectorFilter = normalizeTagList(industrySector);
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
        let favoriteIds = new Set();
        if (items.length > 0) {
            const favorites = await this.favoriteModel
                .find({
                userId,
                targetType: favorite_entity_1.FavoriteTargetType.PROJECT,
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
    async findDetail(userId, projectId) {
        const project = await this.projectModel.findOne({ projectId }).lean();
        if (!project) {
            throw new common_1.NotFoundException('项目不存在');
        }
        const favorite = await this.favoriteModel.exists({
            userId,
            targetType: favorite_entity_1.FavoriteTargetType.PROJECT,
            targetId: project.projectId,
        });
        return { project: { ...project, isFavorite: Boolean(favorite) } };
    }
    async getFilterOptions(query) {
        const categoryKey = query.category?.toLowerCase();
        const parentName = query.parent;
        if (categoryKey) {
            const dataset = PROJECT_FILTER_DATASET_MAP[categoryKey];
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
            categories: PROJECT_FILTER_DATASET_LIST.map((dataset) => ({
                key: dataset.key,
                label: dataset.label,
                options: dataset.firstLevel,
            })),
        };
    }
};
exports.ProjectService = ProjectService;
exports.ProjectService = ProjectService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(project_entity_1.Project.name)),
    __param(1, (0, mongoose_1.InjectModel)(favorite_entity_1.Favorite.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], ProjectService);
//# sourceMappingURL=project.service.js.map