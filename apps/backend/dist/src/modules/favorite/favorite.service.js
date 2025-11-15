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
exports.FavoriteService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const favorite_entity_1 = require("./entities/favorite.entity");
const project_entity_1 = require("../project/entities/project.entity");
const screen_entity_1 = require("../screen/entities/screen.entity");
let FavoriteService = class FavoriteService {
    constructor(favoriteModel, projectModel, screenModel) {
        this.favoriteModel = favoriteModel;
        this.projectModel = projectModel;
        this.screenModel = screenModel;
    }
    async ensureProjectExists(projectId) {
        const exists = await this.projectModel.exists({ projectId }).exec();
        if (!exists) {
            throw new common_1.NotFoundException('项目不存在');
        }
    }
    async ensureScreenExists(screenId) {
        const exists = await this.screenModel.exists({ screenId }).exec();
        if (!exists) {
            throw new common_1.NotFoundException('页面不存在');
        }
    }
    async addProjectFavorite(userId, projectId) {
        await this.ensureProjectExists(projectId);
        await this.favoriteModel.updateOne({ userId, targetType: favorite_entity_1.FavoriteTargetType.PROJECT, targetId: projectId }, {
            $setOnInsert: {
                userId,
                targetType: favorite_entity_1.FavoriteTargetType.PROJECT,
                targetId: projectId,
            },
        }, { upsert: true });
        return true;
    }
    async removeProjectFavorite(userId, projectId) {
        const result = await this.favoriteModel.deleteOne({
            userId,
            targetType: favorite_entity_1.FavoriteTargetType.PROJECT,
            targetId: projectId,
        });
        return result.deletedCount > 0;
    }
    async addScreenFavorite(userId, screenId) {
        await this.ensureScreenExists(screenId);
        await this.favoriteModel.updateOne({ userId, targetType: favorite_entity_1.FavoriteTargetType.SCREEN, targetId: screenId }, {
            $setOnInsert: {
                userId,
                targetType: favorite_entity_1.FavoriteTargetType.SCREEN,
                targetId: screenId,
            },
        }, { upsert: true });
        return true;
    }
    async removeScreenFavorite(userId, screenId) {
        const result = await this.favoriteModel.deleteOne({
            userId,
            targetType: favorite_entity_1.FavoriteTargetType.SCREEN,
            targetId: screenId,
        });
        return result.deletedCount > 0;
    }
    async findProjectFavorites(userId, query) {
        const { page = 1, pageSize = 10, platform } = query;
        const skip = (page - 1) * pageSize;
        const filter = {
            userId,
            targetType: favorite_entity_1.FavoriteTargetType.PROJECT,
        };
        const favorites = await this.favoriteModel
            .find(filter)
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        if (!favorites.length) {
            return {
                items: [],
                total: 0,
                page,
                pageSize,
            };
        }
        const projectIds = favorites.map((favorite) => favorite.targetId);
        const projectQuery = {
            projectId: { $in: projectIds },
        };
        if (platform) {
            projectQuery.platform = platform;
        }
        const projects = await this.projectModel.find(projectQuery).lean().exec();
        const projectMap = new Map(projects.map((project) => [project.projectId, project]));
        const filteredItems = projectIds
            .map((projectId) => projectMap.get(projectId))
            .filter(Boolean);
        const total = filteredItems.length;
        const items = filteredItems.slice(skip, skip + pageSize).map((project) => ({
            ...project,
            isFavorite: true,
        }));
        return {
            items,
            total,
            page,
            pageSize,
        };
    }
    async findScreenFavorites(userId, query) {
        const { page = 1, pageSize = 10, platform } = query;
        const skip = (page - 1) * pageSize;
        const filter = {
            userId,
            targetType: favorite_entity_1.FavoriteTargetType.SCREEN,
        };
        const favorites = await this.favoriteModel
            .find(filter)
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        if (!favorites.length) {
            return {
                items: [],
                total: 0,
                page,
                pageSize,
            };
        }
        const screenIds = favorites.map((favorite) => favorite.targetId);
        const screenQuery = {
            screenId: { $in: screenIds },
        };
        if (platform) {
            screenQuery.platform = platform;
        }
        const screens = await this.screenModel.find(screenQuery).lean().exec();
        const screenMap = new Map(screens.map((screen) => [screen.screenId, screen]));
        const filteredItems = screenIds
            .map((screenId) => screenMap.get(screenId))
            .filter(Boolean);
        const total = filteredItems.length;
        const items = filteredItems.slice(skip, skip + pageSize).map((screen) => ({
            ...screen,
            isFavorite: true,
        }));
        return {
            items,
            total,
            page,
            pageSize,
        };
    }
};
exports.FavoriteService = FavoriteService;
exports.FavoriteService = FavoriteService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(favorite_entity_1.Favorite.name)),
    __param(1, (0, mongoose_1.InjectModel)(project_entity_1.Project.name)),
    __param(2, (0, mongoose_1.InjectModel)(screen_entity_1.Screen.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], FavoriteService);
//# sourceMappingURL=favorite.service.js.map