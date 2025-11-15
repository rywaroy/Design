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
exports.FavoriteController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pagination_decorator_1 = require("../../common/decorator/pagination.decorator");
const auth_guard_1 = require("../../common/guards/auth.guard");
const favorite_query_dto_1 = require("./dto/favorite-query.dto");
const favorite_service_1 = require("./favorite.service");
const project_entity_1 = require("../project/entities/project.entity");
const screen_entity_1 = require("../screen/entities/screen.entity");
let FavoriteController = class FavoriteController {
    constructor(favoriteService) {
        this.favoriteService = favoriteService;
    }
    addProjectFavorite(req, projectId) {
        const userId = req.user?.id ?? req.user?._id?.toString();
        return this.favoriteService.addProjectFavorite(userId, projectId);
    }
    addScreenFavorite(req, screenId) {
        const userId = req.user?.id ?? req.user?._id?.toString();
        return this.favoriteService.addScreenFavorite(userId, screenId);
    }
    findProjectFavorites(req, query) {
        const userId = req.user?.id ?? req.user?._id?.toString();
        return this.favoriteService.findProjectFavorites(userId, query);
    }
    findScreenFavorites(req, query) {
        const userId = req.user?.id ?? req.user?._id?.toString();
        return this.favoriteService.findScreenFavorites(userId, query);
    }
    cancelProjectFavorite(req, projectId) {
        const userId = req.user?.id ?? req.user?._id?.toString();
        return this.favoriteService.removeProjectFavorite(userId, projectId);
    }
    cancelScreenFavorite(req, screenId) {
        const userId = req.user?.id ?? req.user?._id?.toString();
        return this.favoriteService.removeScreenFavorite(userId, screenId);
    }
};
exports.FavoriteController = FavoriteController;
__decorate([
    (0, common_1.Post)('projects/:projectId'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: '收藏项目' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FavoriteController.prototype, "addProjectFavorite", null);
__decorate([
    (0, common_1.Post)('screens/:screenId'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: '收藏页面' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('screenId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FavoriteController.prototype, "addScreenFavorite", null);
__decorate([
    (0, common_1.Get)('projects'),
    (0, swagger_1.ApiOperation)({ summary: '获取项目收藏列表' }),
    (0, pagination_decorator_1.ApiPaginatedResponse)(project_entity_1.Project, '获取项目收藏列表成功'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, favorite_query_dto_1.FavoriteQueryDto]),
    __metadata("design:returntype", void 0)
], FavoriteController.prototype, "findProjectFavorites", null);
__decorate([
    (0, common_1.Get)('screens'),
    (0, swagger_1.ApiOperation)({ summary: '获取页面收藏列表' }),
    (0, pagination_decorator_1.ApiPaginatedResponse)(screen_entity_1.Screen, '获取页面收藏列表成功'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, favorite_query_dto_1.FavoriteQueryDto]),
    __metadata("design:returntype", void 0)
], FavoriteController.prototype, "findScreenFavorites", null);
__decorate([
    (0, common_1.Delete)('projects/:projectId'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: '取消项目收藏' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FavoriteController.prototype, "cancelProjectFavorite", null);
__decorate([
    (0, common_1.Delete)('screens/:screenId'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: '取消页面收藏' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('screenId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FavoriteController.prototype, "cancelScreenFavorite", null);
exports.FavoriteController = FavoriteController = __decorate([
    (0, swagger_1.ApiTags)('收藏'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Controller)('favorite'),
    __metadata("design:paramtypes", [favorite_service_1.FavoriteService])
], FavoriteController);
//# sourceMappingURL=favorite.controller.js.map