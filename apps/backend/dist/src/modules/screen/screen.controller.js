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
exports.ScreenController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pagination_decorator_1 = require("../../common/decorator/pagination.decorator");
const screen_list_query_dto_1 = require("./dto/screen-list-query.dto");
const screen_filter_query_dto_1 = require("./dto/screen-filter-query.dto");
const screen_filter_response_dto_1 = require("./dto/screen-filter-response.dto");
const screen_fuzzy_search_query_dto_1 = require("./dto/screen-fuzzy-search-query.dto");
const screen_precise_search_query_dto_1 = require("./dto/screen-precise-search-query.dto");
const screen_search_result_dto_1 = require("./dto/screen-search-result.dto");
const screen_ai_search_dto_1 = require("./dto/screen-ai-search.dto");
const screen_service_1 = require("./screen.service");
const screen_entity_1 = require("./entities/screen.entity");
const screen_ai_service_1 = require("./screen-ai.service");
const auth_guard_1 = require("../../common/guards/auth.guard");
let ScreenController = class ScreenController {
    constructor(screenService, screenAiService) {
        this.screenService = screenService;
        this.screenAiService = screenAiService;
    }
    findByProject(req, query) {
        const userId = (req.user?.id ?? req.user?._id?.toString());
        return this.screenService.findByProject(userId, query);
    }
    getFilters(query) {
        return this.screenService.getFilterOptions(query);
    }
    preciseSearch(req, query) {
        const userId = (req.user?.id ?? req.user?._id?.toString());
        return this.screenService.preciseSearch(userId, query);
    }
    fuzzySearch(req, query) {
        const userId = (req.user?.id ?? req.user?._id?.toString());
        return this.screenService.fuzzySearch(userId, query);
    }
    aiFuzzySearch(req, body) {
        const userId = (req.user?.id ?? req.user?._id?.toString());
        return this.screenAiService.searchWithRequirement(userId, body);
    }
};
exports.ScreenController = ScreenController;
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '根据项目查询页面列表' }),
    (0, pagination_decorator_1.ApiPaginatedResponse)(screen_entity_1.Screen, '查询成功'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, screen_list_query_dto_1.ScreenListQueryDto]),
    __metadata("design:returntype", void 0)
], ScreenController.prototype, "findByProject", null);
__decorate([
    (0, common_1.Get)('filters'),
    (0, swagger_1.ApiOperation)({ summary: '获取可供选择的解析字段值' }),
    (0, swagger_1.ApiOkResponse)({
        description: '筛选项获取成功',
        type: screen_filter_response_dto_1.ScreenFilterResponseDto,
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [screen_filter_query_dto_1.ScreenFilterQueryDto]),
    __metadata("design:returntype", void 0)
], ScreenController.prototype, "getFilters", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Post)('search/precise'),
    (0, swagger_1.ApiOperation)({ summary: '精准搜索页面（全部命中条件）' }),
    (0, pagination_decorator_1.ApiPaginatedResponse)(screen_entity_1.Screen, '精准搜索成功'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, screen_precise_search_query_dto_1.ScreenPreciseSearchQueryDto]),
    __metadata("design:returntype", void 0)
], ScreenController.prototype, "preciseSearch", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Post)('search/fuzzy'),
    (0, swagger_1.ApiOperation)({ summary: '模糊搜索页面（命中 50% 以上解析字段）' }),
    (0, pagination_decorator_1.ApiPaginatedResponse)(screen_search_result_dto_1.ScreenSearchResultDto, '模糊搜索成功'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, screen_fuzzy_search_query_dto_1.ScreenFuzzySearchQueryDto]),
    __metadata("design:returntype", void 0)
], ScreenController.prototype, "fuzzySearch", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Post)('search/ai'),
    (0, swagger_1.ApiOperation)({ summary: 'AI 解析需求并执行模糊搜索' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'AI 标签解析与模糊搜索结果',
        type: screen_ai_search_dto_1.ScreenAiSearchResponseDto,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, screen_ai_search_dto_1.ScreenAiSearchRequestDto]),
    __metadata("design:returntype", void 0)
], ScreenController.prototype, "aiFuzzySearch", null);
exports.ScreenController = ScreenController = __decorate([
    (0, swagger_1.ApiTags)('页面'),
    (0, common_1.Controller)('screen'),
    __metadata("design:paramtypes", [screen_service_1.ScreenService,
        screen_ai_service_1.ScreenAiService])
], ScreenController);
//# sourceMappingURL=screen.controller.js.map