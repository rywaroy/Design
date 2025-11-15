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
exports.ProjectController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pagination_decorator_1 = require("../../common/decorator/pagination.decorator");
const project_list_query_dto_1 = require("./dto/project-list-query.dto");
const project_detail_query_dto_1 = require("./dto/project-detail-query.dto");
const project_detail_response_dto_1 = require("./dto/project-detail-response.dto");
const project_filter_query_dto_1 = require("./dto/project-filter-query.dto");
const project_filter_response_dto_1 = require("./dto/project-filter-response.dto");
const project_service_1 = require("./project.service");
const project_entity_1 = require("./entities/project.entity");
const auth_guard_1 = require("../../common/guards/auth.guard");
const project_ai_search_dto_1 = require("./dto/project-ai-search.dto");
const project_ai_service_1 = require("./project-ai.service");
let ProjectController = class ProjectController {
    constructor(projectService, projectAiService) {
        this.projectService = projectService;
        this.projectAiService = projectAiService;
    }
    getFilters(query) {
        return this.projectService.getFilterOptions(query);
    }
    findAll(req, body) {
        const userId = (req.user?.id ?? req.user?._id?.toString());
        return this.projectService.findAll(userId, body);
    }
    findDetail(req, query) {
        const userId = (req.user?.id ?? req.user?._id?.toString());
        return this.projectService.findDetail(userId, query.projectId);
    }
    aiSearch(req, body) {
        const userId = (req.user?.id ?? req.user?._id?.toString());
        return this.projectAiService.searchWithRequirement(userId, body);
    }
};
exports.ProjectController = ProjectController;
__decorate([
    (0, common_1.Get)('filters'),
    (0, swagger_1.ApiOperation)({ summary: '获取项目筛选项' }),
    (0, swagger_1.ApiOkResponse)({
        description: '筛选项获取成功',
        type: project_filter_response_dto_1.ProjectFilterResponseDto,
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [project_filter_query_dto_1.ProjectFilterQueryDto]),
    __metadata("design:returntype", void 0)
], ProjectController.prototype, "getFilters", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Post)('list'),
    (0, swagger_1.ApiOperation)({ summary: '项目列表' }),
    (0, pagination_decorator_1.ApiPaginatedResponse)(project_entity_1.Project, '获取项目列表成功'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, project_list_query_dto_1.ProjectListQueryDto]),
    __metadata("design:returntype", void 0)
], ProjectController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Get)('detail'),
    (0, swagger_1.ApiOperation)({ summary: '项目详情' }),
    (0, swagger_1.ApiOkResponse)({
        description: '获取项目详情成功',
        type: project_detail_response_dto_1.ProjectDetailResponseDto,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, project_detail_query_dto_1.ProjectDetailQueryDto]),
    __metadata("design:returntype", void 0)
], ProjectController.prototype, "findDetail", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Post)('search/ai'),
    (0, swagger_1.ApiOperation)({ summary: 'AI 解析需求并推荐项目' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'AI 标签解析与项目搜索结果',
        type: project_ai_search_dto_1.ProjectAiSearchResponseDto,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, project_ai_search_dto_1.ProjectAiSearchRequestDto]),
    __metadata("design:returntype", void 0)
], ProjectController.prototype, "aiSearch", null);
exports.ProjectController = ProjectController = __decorate([
    (0, swagger_1.ApiTags)('项目'),
    (0, common_1.Controller)('project'),
    __metadata("design:paramtypes", [project_service_1.ProjectService,
        project_ai_service_1.ProjectAiService])
], ProjectController);
//# sourceMappingURL=project.controller.js.map